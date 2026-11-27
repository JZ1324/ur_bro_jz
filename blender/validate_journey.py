"""Fail before export if authored geometry breaks the scene or chess position."""
from collections import Counter
import hashlib
import math
import struct
from journey_voxels import LAYOUT_IDS, chess_piece, chess_scene

POOL = 3877
TREE_DIGEST = '281926b9d1c9d2a6017e41ec78478495c2c8ffcd6597b2b284836624a7673f57'


def validate_chess():
    voxels, squares, pieces = chess_scene()
    cells = {s['square']: s for s in squares}
    assert len(squares) == len(cells) == 64
    assert Counter(s['color'] for s in squares) == {'ivory': 32, 'sage': 32}
    assert cells['a1']['color'] == 'sage' and cells['h1']['color'] == 'ivory'
    for rank in range(1, 9):
        for file in range(8):
            cell = cells[f'{chr(97+file)}{rank}']
            assert cell['color'] == ('ivory' if (file+rank) % 2 == 0 else 'sage')
            assert cell['voxel'][:3] == [(file-3.5)*.64, .765, (4.5-rank)*.64]
            assert cell['voxel'][3:6] == [.64, .13, .64]
    assert len(pieces) == len({p['square'] for p in pieces}) == 32
    back_rank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for color, ranks in [('ivory', (1, 2)), ('sage', (8, 7))]:
        side = [p for p in pieces if p['color'] == color]
        assert Counter(p['kind'] for p in side) == {'pawn': 8, 'rook': 2, 'knight': 2, 'bishop': 2, 'queen': 1, 'king': 1}
        expected = {f'{chr(97+f)}{ranks[0]}': kind for f, kind in enumerate(back_rank)}
        expected.update({f'{chr(97+f)}{ranks[1]}': 'pawn' for f in range(8)})
        assert {p['square']: p['kind'] for p in side} == expected
        queen = next(p for p in side if p['kind'] == 'queen')
        assert cells[queen['square']]['color'] == color
    for p in pieces:
        cell = cells[p['square']]['voxel']
        assert all(v in voxels for v in p['voxels'])
        for v in p['voxels']:
            assert v[1]-v[4]/2 >= .83-1e-9, 'A piece is inside the board'
            for axis in [0, 2]:
                assert abs(v[axis]-cell[axis])+v[axis+3]/2 < .32, 'A piece crosses its square'
    # Compare actual geometry (not materials/names) for each silhouette.
    shapes = {tuple(tuple(v[:9]) for v in chess_piece(kind, 'ivory')) for kind in set(back_rank+['pawn'])}
    assert len(shapes) == 6, 'Every piece type needs a distinct silhouette'
    white = chess_piece('knight', 'ivory', 1)
    black = chess_piece('knight', 'sage', -1)
    assert all(a[2] == -b[2] for a, b in zip(white, black)), 'Knights must face their opponents'


def validate_layouts(layouts):
    validate_chess()
    assert len(layouts) == len(LAYOUT_IDS) == 7
    assert all(len(layout) == POOL for layout in layouts)
    for layout in layouts:
        for voxel in layout:
            assert len(voxel) == 12 and all(math.isfinite(v) for v in voxel)
            assert all(v > 0 for v in voxel[3:6])
            assert all(0 <= v <= 1 for v in voxel[9:])
    trees = [v for layout in layouts[:2] for voxel in layout for v in voxel]
    assert hashlib.sha256(struct.pack(f'<{len(trees)}f', *trees)).hexdigest() == TREE_DIGEST, 'Original garden/tree geometry must remain unchanged'


if __name__ == '__main__':
    from journey_voxels import create_layouts
    validate_layouts(create_layouts())
    print('Validated 64 squares, 32 starting pieces, 6 silhouettes and 7 × 3,877 finite voxel layouts.')
