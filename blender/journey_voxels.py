"""Editable Y-up voxel objects for the garden's scroll journey.

Each record is position, size, Euler rotation, and linear RGB. The same records
can be consumed by Three.js instancing or imported as cubes in Blender.
"""
import heapq
import math
from garden_voxels import VOXELS, rgb

LAYOUT_IDS = ['opening', 'about', 'projects', 'school', 'music', 'memories', 'contact']


def cube(x, y, z, sx, sy, sz, color, rotation=(0, 0, 0)):
    return [x, y, z, sx, sy, sz, *rotation, *rgb(color)[:3]]


class Object:
    def __init__(self):
        self.voxels = []

    def box(self, x, y, z, sx, sy, sz, color, step=.29):
        """Tile a cuboid's shell, retaining flat edges and avoiding hidden fill."""
        nx, ny, nz = [max(1, math.ceil(s / step)) for s in (sx, sy, sz)]
        dx, dy, dz = sx / nx, sy / ny, sz / nz
        for ix in range(nx):
            for iy in range(ny):
                for iz in range(nz):
                    if 0 < ix < nx-1 and 0 < iy < ny-1 and 0 < iz < nz-1:
                        continue
                    # A subtle, deterministic paint variation gives the cubes depth.
                    tint = 1 - ((ix * 13 + iy * 7 + iz * 19) % 7) * .008
                    v = cube(x-sx/2+(ix+.5)*dx, y-sy/2+(iy+.5)*dy,
                             z-sz/2+(iz+.5)*dz, dx, dy, dz, color)
                    v[9:] = [c * tint for c in v[9:]]
                    self.voxels.append(v)

    def ring(self, x, y, z, outer, inner, depth, color, step=.19, top_only=False):
        n = math.ceil(outer / step)
        for ix in range(-n, n+1):
            for iy in range(-n, n+1):
                radius = math.hypot(ix*step, iy*step)
                if inner <= radius <= outer and (not top_only or iy >= 0):
                    self.box(x+ix*step, y+iy*step, z, step, step, depth, color)

    def tilt(self, start, angle, pivot):
        for v in self.voxels[start:]:
            y, z = v[1]-pivot[1], v[2]-pivot[2]
            v[1] = pivot[1]+y*math.cos(angle)-z*math.sin(angle)
            v[2] = pivot[2]+y*math.sin(angle)+z*math.cos(angle)
            v[6] = angle


def chess_piece(kind, color, facing=1):
    """Six distinct, square-footed silhouettes; coordinates are local to a square."""
    o = Object()
    ivory = color == 'ivory'
    body, edge, inset = ('f1e5c9', 'c4af82', '807154') if ivory else ('476c57', '78917a', '263e32')
    def block(x, y, z, sx, sy, sz, paint=body):
        # Single cuboids keep small details crisp within the shared instance budget.
        o.voxels.append(cube(x, y, z*facing, sx, sy, sz, paint))
    block(0, .045, 0, .46, .09, .46, edge)
    block(0, .11, 0, .40, .07, .40)
    block(0, .18, 0, .32, .07, .32)
    height = {'pawn': .69, 'rook': .86, 'knight': .99, 'bishop': 1.08, 'queen': 1.18, 'king': 1.34}[kind]
    neck = height - (.36 if kind == 'pawn' else .51)
    block(0, (.22+neck)/2, 0, .21, neck-.22+.02, .21)
    block(0, neck, 0, .29, .075, .29, edge)
    if kind == 'pawn':
        block(0, .46, 0, .21, .18, .21)
        block(0, .55, 0, .29, .19, .29)
        block(0, .655, 0, .19, .07, .19)
    elif kind == 'rook':
        block(0, .59, 0, .33, .22, .33)
        block(0, .72, 0, .43, .08, .43, edge)
        for x in [-.145, .145]:
            for z in [-.145, .145]:
                block(x, .805, z, .14, .11, .14)
        block(0, .75, 0, .13, .02, .13, inset)
    elif kind == 'knight':
        # A swept neck, forward muzzle, two ears and inset eyes read as a horse.
        block(0, .55, .07, .25, .26, .29)
        block(0, .72, .015, .25, .23, .28)
        block(0, .84, -.08, .28, .18, .33)
        block(0, .755, -.175, .27, .12, .16)
        block(0, .60, .205, .16, .27, .06, edge)
        for x in [-.085, .085]:
            block(x, .945, .035, .075, .09, .10)
            block(x*1.66, .86, -.10, .012, .045, .045, inset)
    elif kind == 'bishop':
        block(0, .69, 0, .33, .085, .33)
        block(0, .81, 0, .29, .17, .26)
        # The stepped diagonal opening is actual geometry, not a painted stripe.
        block(-.09, .93, 0, .11, .13, .22)
        block(.07, .96, 0, .13, .18, .22)
        block(0, 1.065, 0, .11, .03, .12)
    elif kind == 'queen':
        block(0, .80, 0, .33, .09, .33)
        block(0, .92, 0, .30, .16, .30)
        block(0, 1.035, 0, .40, .07, .40, edge)
        for x, z in [(-.15,-.15),(-.15,.15),(.15,-.15),(.15,.15),(0,0)]:
            block(x, 1.12, z, .10, .10 if x else .12, .10)
    else:
        block(0, .91, 0, .34, .08, .34)
        block(0, 1.015, 0, .25, .13, .25)
        block(0, 1.205, 0, .095, .27, .095)
        block(0, 1.23, 0, .29, .085, .095)
    return o.voxels


def chess_scene():
    """a1 is dark; white is nearest +Z, with both queens on their own colour."""
    o = Object()
    for y, width, depth, paint in [(.22, 6.02, .18, '735440'), (.38, 5.86, .14, '9d7957'),
                                    (.51, 5.66, .12, 'bd9d73'), (.64, 5.78, .14, '8e6e50')]:
        o.box(0, y, 0, width, depth, width, paint, step=.48)
    for x in [-2.76, 2.76]:
        o.box(x, .75, 0, .20, .08, 5.70, 'd6bd91', step=.45)
        o.box(0, .75, x, 5.32, .08, .20, 'd6bd91', step=.45)
    squares, pieces = [], []
    back_rank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook']
    for rank in range(1, 9):
        for file in range(8):
            x, z = (file-3.5)*.64, (4.5-rank)*.64
            square = f'{chr(97+file)}{rank}'
            color = 'ivory' if (file+rank) % 2 == 0 else 'sage'
            cell = cube(x, .765, z, .64, .13, .64, 'e5dcc0' if color == 'ivory' else '779581')
            squares.append({'square': square, 'color': color, 'voxel': cell})
            o.voxels.append(cell)
            if rank not in [1, 2, 7, 8]:
                continue
            kind = 'pawn' if rank in [2, 7] else back_rank[file]
            side = 'ivory' if rank <= 2 else 'sage'
            geometry = chess_piece(kind, side, 1 if side == 'ivory' else -1)
            for v in geometry:
                v[0] += x
                v[1] += .83
                v[2] += z
            pieces.append({'square': square, 'kind': kind, 'color': side, 'voxels': geometry})
            o.voxels.extend(geometry)
    return o.voxels, squares, pieces


def chess():
    return chess_scene()[0]


def books():
    o = Object()
    for x, y, z, width, depth, color in [(-.12, 1.05, .15, 5.25, 3.05, '728766'),
                                       (.2, 2.06, -.03, 4.6, 2.9, 'c89489'),
                                       (-.25, 3.07, -.15, 4.85, 2.75, 'c8b888')]:
        for dy in [-.42, .42]:
            o.box(x, y+dy, z, width, .13, depth, color, .34)
        o.box(x+.08, y, z+.025, width-.29, .70, depth-.2, 'eee6cb', .36)
        o.box(x-width/2+.06, y, z, .18, .82, depth, color, .34)
        for line in [-.20, 0, .20]:
            o.box(x+.09, y+line, z+depth/2-.065, width-.35, .026, .03, 'c5bea8', .4)
        # Raised spine ribs, inset title blocks, and uneven page signatures.
        for dz in [-depth*.34, depth*.34]:
            o.box(x-width/2-.045, y, z+dz, .075, .78, .12, 'dfcba0', .4)
        o.box(x-width/2-.05, y, z, .075, .34, .80, '536953', .4)
        for dy in [-.27, -.10, .10, .27]:
            o.box(x+width/2-.09, y+dy, z+.02, .035, .018, depth-.30, 'bcb49e', .4)
    o.box(.55, 3.45, 1.11, .32, .07, .5, 'bd8383')
    o.box(.55, 3.04, 1.40, .32, .84, .075, 'bd8383')
    # A small pencil across the top book.
    o.box(.15, 3.68, -.15, 3.4, .14, .15, '78926d')
    o.box(-1.63, 3.68, -.15, .18, .1, .10, 'ddc59c')
    o.box(-1.76, 3.68, -.15, .09, .06, .06, '4b5144')
    o.box(1.96, 3.68, -.15, .20, .15, .15, 'd7a49f')
    return o.voxels


def headphones():
    o = Object()
    o.ring(0, 2.45, 0, 2.61, 2.27, .56, '77916f', top_only=True)
    o.ring(0, 2.45, .04, 2.30, 2.12, .42, 'dbcbb0', top_only=True)
    for side in [-1, 1]:
        o.box(side*2.38, 2.48, 0, .27, 1.20, .44, 'b4bda4')
        o.box(side*2.40, 1.85, .02, .80, 1.85, 1.46, '7c936e')
        o.box(side*2.44, 1.85, .02, .85, 1.38, 1.68, '93a783')
        o.box(side*1.99, 1.85, .02, .24, 1.52, 1.33, '334c3f')
        o.box(side*2.86, 1.90, .02, .08, .76, .85, 'bbbea2')
        o.box(side*2.58, 2.91, .03, .10, .4, .38, 'c5a37d')
        # Layered cushions enclose a recessed speaker opening.
        for dy in [-.59, .59]:
            o.box(side*1.80, 1.85+dy, .02, .18, .25, 1.10, '536657')
        for dz in [-.49, .49]:
            o.box(side*1.79, 1.85, .02+dz, .20, 1.00, .22, '637361')
        o.box(side*1.91, 1.85, .02, .025, .89, .64, '213b32')
        for dy in [-.18, 0, .18]:
            o.box(side*2.92, 1.90+dy, .05, .06, .035, .45, '6a8068')
    o.box(2.57, .86, .42, .16, .12, .25, 'c5a37d')
    o.box(2.72, 1.31, .77, .17, .12, .07, 'ddc9a6')
    return o.voxels



def camera():
    o = Object()
    o.box(0, 2.65, 0, 5.05, 2.80, 1.65, '6e8268')
    o.box(0, 4.13, 0, 5.03, .27, 1.65, 'd4ccb2')
    o.box(0, 1.20, 0, 4.98, .14, 1.6, 'b5bba3')
    o.box(-2.05, 2.67, .88, .73, 2.52, .20, '405846')
    o.box(-1.20, 3.61, .87, .67, .38, .12, 'c7d2b9')
    o.box(.26, 4.42, -.04, 1.45, .40, 1.13, '71846b')
    o.box(.26, 4.65, -.10, 1.0, .13, .92, 'b8bea6')
    o.box(-1.83, 4.4, .08, .57, .29, .65, 'b79b7b')
    o.box(1.58, 3.6, .89, .22, .18, .10, 'd7a1a5')
    o.ring(.28, 2.65, 1.0, 1.38, 0, .32, '32493e')
    o.ring(.28, 2.65, 1.23, 1.24, .92, .16, 'b2b89e', step=.15)
    o.ring(.28, 2.65, 1.44, 1.11, .83, .29, '253c36', step=.15)
    o.ring(.28, 2.65, 1.64, 1.12, .87, .11, '9aa78f', step=.15)
    o.ring(.28, 2.65, 1.64, .83, 0, .05, '203d3b', step=.15)
    o.ring(.28, 2.65, 1.68, .57, 0, .025, '325750', step=.15)
    o.box(.03, 2.96, 1.72, .28, .20, .04, 'aacabb')
    o.box(.14, 2.81, 1.73, .13, .09, .04, '6d9b8d')
    o.box(.26, 4.39, .55, .63, .24, .06, '293f36')
    o.box(.26, 4.43, .59, .32, .10, .03, '9eb9a8')
    o.box(-1.83, 4.60, .08, .35, .12, .37, 'e5ceb0')
    for x in [1.22, 1.42, 1.62, 1.82]:
        o.box(x, 4.36, -.12, .08, .16, .54, '7a826a')
    for x in [-2.62, 2.62]:
        o.box(x, 3.65, 0, .18, .27, .45, 'b7a17b')
    return o.voxels


def mailbox():
    o = Object()
    o.box(-.30, .28, .1, 2.6, .30, 2.25, '9baa7a')
    o.box(-.30, 1.42, .1, .30, 2.15, .33, 'a18462')
    o.box(-.30, 2.47, .1, 2.50, .19, 2.75, '9b795b')
    o.box(-.30, 3.19, .1, 2.44, 1.30, 2.66, 'b17a64')
    o.box(-.30, 3.91, .1, 2.10, .25, 2.66, 'c89072')
    o.box(-.30, 4.09, .1, 1.58, .16, 2.66, 'd3a17e')
    o.box(-.30, 4.21, .1, .94, .09, 2.66, 'd8ab88')
    o.box(-.30, 3.22, 1.465, 2.11, 1.04, .085, '935c4d')
    o.box(-.30, 3.56, 1.54, .46, .10, .085, 'dfc79d')
    for x in [-1.40, .80]:
        o.box(x, 3.23, 1.51, .09, 1.15, .07, 'd2a286')
    for y in [2.70, 3.78]:
        o.box(-.30, y, 1.51, 2.24, .08, .07, 'd2a286')
    o.box(-.30, 3.46, 1.535, 1.20, .08, .05, '513e35')
    for x in [-.83, .25]:
        o.box(x, 2.64, 1.53, .22, .10, .10, 'b9aa83')
    o.box(1.02, 3.74, .02, .13, 1.42, .13, '856f53')
    o.box(1.02, 4.30, .50, .14, .39, 1.02, 'd3a47d')
    # An ivory envelope in the door gives contact a familiar silhouette.
    o.box(-.27, 2.93, 1.555, 1.10, .55, .08, 'efe3c6')
    for i in range(7):
        o.box(-.75+i*.16, 2.94+abs(3-i)*.064, 1.61, .15, .033, .025, 'b9aa8c')
    o.box(.08, 3.07, 1.615, .14, .14, .028, 'bd8580')
    return o.voxels


def equalize(voxels, count):
    """Subdivide large blocks without changing the silhouette or losing pieces."""
    if len(voxels) > count:
        raise ValueError(f'Layout has {len(voxels)} blocks; budget is {count}')
    heap = [(-v[3]*v[4]*v[5], i, v) for i, v in enumerate(voxels)]
    heapq.heapify(heap)
    serial = len(heap)
    while len(heap) < count:
        _, _, v = heapq.heappop(heap)
        axis = max(range(3), key=lambda i: v[3+i])
        length = v[3+axis]/2
        for side in [-1, 1]:
            child = v.copy()
            child[3+axis] = length
            offset = [0, 0, 0]
            offset[axis] = side*length/2
            # Authored objects use only X rotations; local subdivision follows it.
            child[0] += offset[0]
            child[1] += offset[1]*math.cos(v[6])-offset[2]*math.sin(v[6])
            child[2] += offset[1]*math.sin(v[6])+offset[2]*math.cos(v[6])
            heapq.heappush(heap, (-child[3]*child[4]*child[5], serial, child))
            serial += 1
    return [item[2] for item in heap]


def spatial_order(voxels):
    """A deterministic Morton order keeps nearby blocks travelling together."""
    lo = [min(v[i] for v in voxels) for i in range(3)]
    span = [max(v[i] for v in voxels)-lo[i] or 1 for i in range(3)]
    def key(v):
        xyz = [int((v[i]-lo[i])/span[i]*1023) for i in range(3)]
        return sum(((xyz[axis] >> bit) & 1) << (bit*3+axis)
                   for bit in range(10) for axis in range(3))
    return sorted(voxels, key=key)


def create_layouts():
    opening = [cube(x, z, -y, sx, sz, sy, color)
               for group, x, y, z, sx, sy, sz, color in VOXELS
               if group.startswith('Story_cherry')]
    opening = spatial_order(opening)
    about = [v.copy() for v in opening]
    for v in about:
        v[0] -= .3
        v[2] += 2.1
    layouts = [opening, about]
    for generate in [chess, books, headphones, camera, mailbox]:
        layouts.append(spatial_order(equalize(generate(), len(opening))))
    return layouts
