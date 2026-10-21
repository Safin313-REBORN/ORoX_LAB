import { ComponentInstance, Wire, NetState, ComponentPin, WireEndpoint } from '../../types/circuit';
import { BOARD_DEFINITIONS } from '../../boards/boardRegistry';
import { COMPONENT_CATALOG } from '../models/componentRegistry';

export class DisjointSet {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  makeSet(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  find(x: string): string {
    if (!this.parent.has(x)) {
      this.makeSet(x);
      return x;
    }
    const p = this.parent.get(x)!;
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return p;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return;

    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;

    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }
}

export function pinKey(endpoint: WireEndpoint): string {
  return `${endpoint.componentId}:${endpoint.pinId}`;
}

export function parsePinKey(key: string): WireEndpoint {
  const parts = key.split(':');
  return { componentId: parts[0], pinId: parts[1] };
}

export function resolvePinDefinition(
  component: ComponentInstance,
  pinId: string,
  boardId: string
): ComponentPin | undefined {
  if (component.type === 'board' || component.type.startsWith('esp32')) {
    const board = BOARD_DEFINITIONS[boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
    return board.pins.find(p => p.id === pinId);
  }
  const meta = COMPONENT_CATALOG[component.type];
  if (!meta) return undefined;
  return meta.pins.find(p => p.id === pinId);
}

export function buildCircuitNets(
  components: ComponentInstance[],
  wires: Wire[],
  boardId: string
): Map<string, NetState> {
  const ds = new DisjointSet();
  const componentMap = new Map<string, ComponentInstance>();
  components.forEach(c => componentMap.set(c.id, c));

  // Initialize set for every pin on every component
  for (const comp of components) {
    let pins: ComponentPin[] = [];
    if (comp.type === 'board' || comp.type.startsWith('esp32')) {
      const board = BOARD_DEFINITIONS[boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
      pins = board.pins;
    } else {
      const meta = COMPONENT_CATALOG[comp.type];
      if (meta) pins = meta.pins;
    }

    for (const p of pins) {
      ds.makeSet(pinKey({ componentId: comp.id, pinId: p.id }));
    }
  }

  // Connect pins linked by wires
  for (const wire of wires) {
    const k1 = pinKey(wire.start);
    const k2 = pinKey(wire.end);
    ds.makeSet(k1);
    ds.makeSet(k2);
    ds.union(k1, k2);
  }

  // Group into nets
  const netGroups = new Map<string, WireEndpoint[]>();
  for (const comp of components) {
    let pins: ComponentPin[] = [];
    if (comp.type === 'board' || comp.type.startsWith('esp32')) {
      const board = BOARD_DEFINITIONS[boardId] || BOARD_DEFINITIONS['esp32doit-devkit-v1'];
      pins = board.pins;
    } else {
      const meta = COMPONENT_CATALOG[comp.type];
      if (meta) pins = meta.pins;
    }

    for (const p of pins) {
      const pk = pinKey({ componentId: comp.id, pinId: p.id });
      const root = ds.find(pk);
      if (!netGroups.has(root)) {
        netGroups.set(root, []);
      }
      netGroups.get(root)!.push({ componentId: comp.id, pinId: p.id });
    }
  }

  const resultNets = new Map<string, NetState>();
  let netCounter = 1;

  for (const [rootKey, endpoints] of netGroups.entries()) {
    // Determine net name & characteristics
    let hasVcc = false;
    let hasGnd = false;
    let designatedName = `NET_${netCounter++}`;

    for (const ep of endpoints) {
      const comp = componentMap.get(ep.componentId);
      if (!comp) continue;
      const pinDef = resolvePinDefinition(comp, ep.pinId, boardId);
      if (!pinDef) continue;

      if (pinDef.signalType === 'POWER_VCC' || pinDef.name === '3V3' || pinDef.name === 'VIN' || pinDef.name === 'VCC') {
        hasVcc = true;
        designatedName = pinDef.name === 'VIN' ? 'NET_VIN_5V' : 'NET_3V3';
      } else if (pinDef.signalType === 'POWER_GND' || pinDef.name === 'GND') {
        hasGnd = true;
        designatedName = 'NET_GND';
      } else if (pinDef.gpioNum !== undefined && designatedName.startsWith('NET_')) {
        designatedName = `NET_GPIO${pinDef.gpioNum}`;
      }
    }

    const logicState = (hasVcc && hasGnd) ? 'SHORT' : (hasVcc ? 'HIGH' : (hasGnd ? 'LOW' : 'FLOATING'));
    const voltage = (hasVcc && hasGnd) ? 0 : (hasVcc ? 3.3 : 0);

    resultNets.set(rootKey, {
      id: rootKey,
      name: designatedName,
      pins: endpoints,
      voltage,
      logic: logicState,
      pull: 'NONE'
    });
  }

  return resultNets;
}

/**
 * Calculates absolute screen/canvas coordinates of a pin on a component.
 */
export function calculateAbsolutePinPosition(
  comp: ComponentInstance,
  pin: ComponentPin
): { x: number; y: number } {
  const rad = (comp.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // Offset from top-left
  const rx = pin.x * cos - pin.y * sin;
  const ry = pin.x * sin + pin.y * cos;

  return {
    x: comp.x + rx,
    y: comp.y + ry
  };
}
