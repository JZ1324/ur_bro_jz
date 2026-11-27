"""Export shared authoring data to a compact, versioned Float32 layout buffer."""
import json
from pathlib import Path
import struct
from journey_voxels import LAYOUT_IDS, create_layouts
from validate_journey import validate_layouts

root = Path(__file__).resolve().parent.parent
layouts = create_layouts()
validate_layouts(layouts)
count = len(layouts[0])
assert all(len(layout) == count for layout in layouts)
values = [value for layout in layouts for voxel in layout for value in voxel]
output = root / 'public' / 'models'
output.mkdir(parents=True, exist_ok=True)
(output / 'journey-voxels.bin').write_bytes(struct.pack(f'<{len(values)}f', *values))
(output / 'journey-voxels.json').write_text(json.dumps({
    'version': 1, 'count': count, 'stride': 12, 'layouts': LAYOUT_IDS,
    'buffer': 'journey-voxels.bin',
    'components': ['x', 'y', 'z', 'sx', 'sy', 'sz', 'rx', 'ry', 'rz', 'r', 'g', 'b'],
}, indent=2)+'\n')
print(f'Exported {len(layouts)} layouts × {count} blocks ({len(values)*4:,} bytes).')
