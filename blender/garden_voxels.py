"""Deterministic garden voxel definitions, shared by Blender and the web exporter.

Coordinates are Blender Z-up. Importing this module requires only Python's
standard library; no Blender process is needed to build the scroll assets.
"""
import math
import random
import struct

random.seed(73)

def f32(value):
    return struct.unpack('f', struct.pack('f', value))[0]

def rgb(hexcode):
    values = [int(hexcode[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values) + (1,)

PAL = {
    'grass': ['91a861', '9bb76c', 'a5bb75', '86a35c', '789754', 'abc07b'],
    'soil': ['927258', 'aa8768', '886c53', '9c7c5f', 'b29372'],
    'moss': ['5b793d', '77934b', '889f54', '9fb366', '698b42'],
    'pine': ['385f42', '55784c', '6c8852', '466c43', '7d955b'],
    'bark': ['72513f', '80604a', '926d53', '614534', 'a17a58'],
    'pink': ['ed9cb5', 'f6b3c8', 'f8c4d3', 'ffd1dd', 'e79ab2', 'ffdee6'],
    'stone': ['a4aa91', 'b9bba7', 'c9c9b8', '969e86', 'd6d4bf'],
    'wood': ['b9956c', 'c4a67c', 'd3b78d', 'a8825c', 'dec39c'],
    'water': ['64b9b0', '75c7be', '8dcfc2', '58aaa4', '81c5b6'],
    'flower': ['fff1cf', 'fffcdf', 'ecb0be', 'f3c7d4', 'e9c66c'],
    'terra': ['b56f52', 'ce8766', '9d5945'],
}
VOXELS = []

def box(group, x, y, z, sx, sy=None, sz=None, color=None):
    sy = sx if sy is None else sy
    sz = sx if sz is None else sz
    color = color or random.choice(PAL['grass'])
    VOXELS.append((group, x, y, z, sx, sy, sz, color))

def pick(palette):
    return random.choice(PAL[palette])

def inside(x, y):
    return abs(x) < 5.15 and abs(y) < 4.35 and abs(x) + abs(y) < 8.0

def pond(x, y):
    return ((x+0.15)/2.3)**2 + ((y+1.5)/1.85)**2 < 1 or ((x-0.9)/1.4)**2 + ((y+0.1)/1.1)**2 < 1

step = .32
for ix in range(-16, 17):
    for iy in range(-14, 15):
        x, y = ix*step, iy*step
        if not inside(x,y):
            continue
        wet = pond(x,y)
        top = -.49 if wet else .03
        box('Island_grass',x,y,top-.12,step,step,.24,pick('water' if wet else 'grass'))
        edge = any(not inside(x+dx*step,y+dy*step) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
        shore = not wet and any(pond(x+dx*step,y+dy*step) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
        if edge or shore:
            layers = random.choice([3,4,4,5]) if edge else 2
            for iz in range(layers):
                box('Island_earth',x,y,-.28-iz*.28,step,step,.29,pick('soil'))
            if random.random()<.5 and not wet:
                box('Edge_moss',x,y,.02,step*.75,step*.76,.1,pick('moss'))
        if wet:
            box('Pond_water',x,y,-.265,step+.002,step+.002,.09,pick('water'))
        elif random.random()<.4:
            box('Meadow_tufts',x+random.uniform(-.1,.1),y+random.uniform(-.1,.1),.08,.10,.08,random.uniform(.1,.21),pick('grass'))

# Closed underside follows the same stepped silhouette as the grassy surface.
for ix in range(-16,17):
    for iy in range(-14,15):
        if inside(ix*step,iy*step):
            box('Island_core',ix*step,iy*step,-.86,step,step,.56,pick('soil'))

def voxel_branch(group, a, b, r1, r2):
    a, b = tuple(map(f32, a)), tuple(map(f32, b))
    distance = math.sqrt(sum(f32(y-x)**2 for x,y in zip(a,b)))
    count = max(2,int(distance/.12))
    for i in range(count+1):
        t=i/count
        p=tuple(f32(f32(x*f32(1-t))+f32(y*f32(t))) for x,y in zip(a,b))
        r=r1*(1-t)+r2*t
        box(group,round(p[0]/.10)*.10,round(p[1]/.10)*.10,round(p[2]/.10)*.10,r,r,r,pick('bark'))

def crown(group,cx,cy,cz,rx,ry,rz,unit=.18):
    # Shell voxels preserve a fluffy silhouette without paying for invisible interiors.
    for ix in range(-math.ceil(rx/unit),math.ceil(rx/unit)+1):
        for iy in range(-math.ceil(ry/unit),math.ceil(ry/unit)+1):
            for iz in range(-math.ceil(rz/unit),math.ceil(rz/unit)+1):
                x,y,z=ix*unit,iy*unit,iz*unit
                d=(x/rx)**2+(y/ry)**2+(z/rz)**2
                noise=random.uniform(-.15,.15)
                if .66<d+noise<1.0 and random.random()>.15:
                    size=unit*random.uniform(.78,1.18)
                    box(group,cx+x,cy+y,cz+z,size,size,size,pick('pink'))
                    if random.random()<.06:
                        box(group,cx+x+.07,cy+y,cz+z-.13,size*.6,color='ffdae2')

def cherry(name,x,y,scale=1):
    def p(a,b,c):return (x+a*scale,y+b*scale,c*scale*.88)
    for a,b,c,d in [((0,0,.05),(.1,0,1.5),.53,.40),((.1,0,1.5),(.45,.08,3.05),.4,.25),
                    ((.15,0,1.7),(-1.0,.05,2.65),.33,.20),((-.75,.04,2.45),(-1.7,.10,3.25),.22,.11),
                    ((.3,.03,2.4),(1.4,.25,3.4),.27,.12),((.1,0,1.9),(.0,-.7,3.3),.26,.10),
                    ((.4,.05,2.8),(.2,.55,4.0),.22,.08)]:
        voxel_branch(name+'_trunk',p(*a),p(*b),c*scale,d*scale)
    for angle in [0,1.4,2.8,4.2,5.4]:
        voxel_branch(name+'_roots',p(0,0,.24),p(math.cos(angle)*.75,math.sin(angle)*.7,.02),.3*scale,.12*scale)
    clusters=[(-1.55,.10,3.35,1.12,.9,.65),(-.85,-.6,3.75,1.1,.92,.76),(.3,-.7,3.45,1.1,.85,.67),
              (.2,.45,4.2,1.15,1.0,.85),(1.4,.35,3.6,1.05,.9,.72),(1.05,-.4,3.25,1.05,.8,.65),
              (-.6,.85,3.6,1.12,.87,.7)]
    for a,b,c,rx,ry,rz in clusters:
        crown(name+'_blossoms',*p(a,b,c),rx*scale,ry*scale,rz*scale*.85,.125*scale)

cherry('Story_cherry',.3,2.10,1.27)
cherry('Small_cherry',4.0,.65,.72)

def pine(x,y,h):
    box('Cypress_trunks',x,y,h*.35,.16,.16,h*.7,pick('bark'))
    for iz in range(int(h/.22)):
        z=.25+iz*.22
        radius=.50*(1-z/(h+.4))+.08
        for dx,dy in [(0,0),(.18,0),(-.18,0),(0,.18),(0,-.18)]:
            if radius > .2 or dx+dy==0:
                box('Cypress_foliage',x+dx,y+dy,z,radius*1.2,radius*1.2,.33,pick('pine'))

for x,y,h in [(-4,2.0,2.7),(-3.3,2.9,3.2),(-2.4,2.65,1.8),(3.6,3.1,2.7),(2.8,3.4,2.0),(-4.5,.5,1.8),(4.5,2.5,1.75),(-1.3,3.5,1.25)]:
    pine(x,y,h)

def bush(x,y,r=.55):
    for i in range(30):
        dx,dy=random.uniform(-r,r),random.uniform(-r,r)
        if dx*dx+dy*dy<r*r:
            z=max(.05,math.sqrt(max(0,r*r-dx*dx-dy*dy))*.75)
            box('Garden_shrubs',x+dx,y+dy,z,.20,.20,.24,pick('moss'))

for x,y,r in [(-4.5,-2,.5),(-3.7,-2.7,.55),(3.0,1.2,.6),(4.25,-.6,.6),(3.5,-3.15,.6),(-1.4,2.8,.55),(-3.6,3.5,.65),(1.4,3.6,.65),(-4.3,-.8,.55),(1.9,-3.6,.5)]:
    bush(x,y,r)

def rock(x,y,s=.5):
    for dx,dy,z,w in [(0,0,.20,1),(.12,0,.42,.68),(-.14,.12,.26,.62)]:
        box('Mossy_stones',x+dx*s,y+dy*s,z*s,s*w,s*w*.82,s*.46,pick('stone'))
    box('Rock_moss',x,y,s*.67,s*.47,s*.42,.08,pick('moss'))

for x,y,s in [(-2.7,-2.4,1),(-2.2,-.8,.8),(2.5,-1.4,.7),(2.25,1.0,.9),(-2.4,1.5,1.25),(.8,-3.4,.7),(-3.1,-3.0,.55),(3.0,-3.3,.65),(-1.9,2.2,.7)]:
    rock(x,y,s)

# A continuous stepping-stone walk across the bridge connects the garden landmarks.
for x,y in [(-3.25,-1.0),(-2.85,-1.25),(-2.35,-1.3),(-1.9,-1.2),(-1.4,-.7),(-1.3,-.25),(-1.6,.3),(-1.35,.8),(-.8,1.05),(-.25,1.0),(.3,.95),(1.7,-.75),(2.2,-1.05),(2.65,-1.45),(3.1,-1.9),(3.55,-2.35),(3.95,-2.85),(4.3,-3.25)]:
    if not pond(x,y):
        box('Stepping_stones',x,y,.09,.52,.39,.14,pick('stone'))
        box('Stepping_stones',x-.04,y+.03,.171,.40,.27,.025,'d8d5c2')

# Arched bridge, individual planks and stepped rails.
for i in range(13):
    t=i/12
    x=-1.30+t*2.9
    h=.17+math.sin(t*math.pi)*.44
    box('Bridge_deck',x,-.68,h,.215,1.0,.13,pick('wood'))
    for yy in [-1.16,-.20]:
        box('Bridge_rails',x,yy,h+.55,.235,.105,.10,'d0b38b')
        box('Bridge_rails',x,yy,h+.29,.235,.06,.07,'b9986c')
    if i in [0,3,6,9,12]:
        for yy in [-1.16,-.20]:
            box('Bridge_posts',x,yy,h+.3,.14,.14,.7,'b69772')
            box('Bridge_posts',x,yy,h+.68,.19,.19,.10,'e0c7a0')

# Quiet bench beneath the tree.
for xx in [1.2,2.55]:
    for yy in [1.18,1.65]:box('Story_bench',xx,yy,.32,.14,.14,.65,'987750')
for yy in [1.12,1.3,1.48,1.66]:box('Story_bench',1.87,yy,.67,1.72,.14,.12,pick('wood'))
for xx in [1.1,2.66]:box('Story_bench',xx,1.7,1.06,.11,.12,.83,'a27f57')
for xx in [1.15+i*.18 for i in range(9)]:box('Story_bench',xx,1.7,1.08,.10,.10,.65,pick('wood'))
box('Story_bench',1.87,1.7,1.43,1.77,.15,.13,'c8ab7d')
for xx in [1.1,2.65]:box('Story_bench',xx,1.4,.94,.12,.67,.1,'bc9a6a')

def pot(name,x,y,z,s=.3,flower=False):
    box(name,x,y,z+s*.4,s*.7,s*.7,s*.8,pick('terra'))
    box(name,x,y,z+s*.77,s,s,s*.18,'c58a69')
    box(name,x,y,z+s*.88,s*.74,s*.74,.035,'5f4d35')
    box(name,x,y,z+s*1.12,.06,.06,s*.55,'5a8145')
    for dx,dy,dz in [(.09,0,.07),(-.07,.04,.12),(0,-.07,.02)]:
        box(name,x+dx,y+dy,z+s*1.25+dz,.17,.14,.12,pick('flower' if flower else 'moss'))

wx,wy=-3.55,.0
for xx in [-.77,.77]:
    for yy in [-.35,.35]:box('Projects_workbench',wx+xx,wy+yy,.43,.14,.14,.86,'9f7a51')
for yy in [-.33,-.1,.13,.36]:box('Projects_workbench',wx,wy+yy,.92,1.85,.21,.14,pick('wood'))
box('Projects_workbench',wx,wy,.21,1.65,.67,.10,'a48056')
for xx in [-.84,.84]:box('Projects_workbench',wx+xx,wy+.38,1.28,.13,.13,1.2,'a7885f')
box('Projects_workbench',wx,wy+.38,1.88,1.93,.32,.12,'d0ad7b')
for i in range(4):pot('Workbench_plants',wx-.65+i*.43,wy+.38,1.94,.22,i%2==0)
for x,y,s in [(wx-.58,wy-.1,.33),(wx+.1,wy+.03,.26),(wx+.54,wy,.2)]:pot('Workbench_plants',x,y,1.0,s,True)
box('Projects_crate',wx-.25,wy,.45,.64,.55,.44,'b89568')
for z in [.28,.46,.63]:box('Projects_crate',wx-.25,wy-.29,z,.67,.05,.04,'8a6b4c')
box('Projects_crate',wx-.25,wy-.325,.46,.21,.015,.07,'664f39')
pot('Garden_pots',wx+1.02,wy+.10,.05,.45)

# Copper-red letterbox and little envelope tucked under its flag.
mx,my=3.8,-2.30
box('Contact_mailbox',mx,my,.72,.14,.15,1.44,'9c734f')
box('Contact_mailbox',mx,my,1.43,.55,.74,.48,'a95845')
box('Contact_mailbox',mx,my,1.72,.43,.75,.13,'bd7457')
box('Contact_mailbox',mx,my,1.80,.29,.75,.07,'c68260')
box('Contact_mailbox',mx,my-.382,1.43,.44,.026,.35,'8b493b')
box('Contact_mailbox',mx,my-.4,1.48,.15,.025,.04,'d8b88a')
box('Contact_mailbox',mx+.29,my+.14,1.86,.045,.07,.42,'855a42')
box('Contact_mailbox',mx+.29,my+.24,2.04,.055,.27,.13,'da916a')

# Lilies and lotus blossom, deliberately pixel-shaped.
for x,y,s in [(-.8,-2.4,.37),(.15,-2.65,.30),(-1.4,-1.9,.29),(.7,-1.7,.24)]:
    box('Pond_lilies',x,y,-.20,s*1.6,s,.035,'799d50')
    box('Pond_lilies',x,y,-.20,s,s*1.6,.035,'88ad5d')
for dx,dy in [(0,.09),(0,-.09),(.09,0),(-.09,0)]:box('Pond_lotus',-.8+dx,-2.4+dy,-.10,.11,.10,.10,'f3b5c9')
box('Pond_lotus',-.8,-2.4,-.04,.085,.085,.1,'ffe3d5')

# Meadow flowers and grass. Avoid paths, water, and occupied furniture.
for i in range(650):
    x,y=random.uniform(-4.9,4.9),random.uniform(-4.0,4.0)
    if not inside(x,y) or pond(x,y) or (-4.6<x<-2.4 and -.65<y<.75) or (1<x<2.8 and .9<y<1.9):continue
    height=random.uniform(.10,.30)
    box('Meadow_stems',x,y,height/2+.02,.035,.035,height,pick('moss'))
    if random.random()<.65:
        color=pick('flower')
        box('Wildflowers',x,y,height+.04,.115,.055,.045,color)
        box('Wildflowers',x,y,height+.04,.055,.115,.045,color)
        box('Wildflowers',x,y,height+.069,.035,.035,.014,'dfbb56')
    else:
        box('Meadow_blades',x+.035,y,.07,.06,.11,.15,pick('grass'))

# Pink petals scattered beneath the cherry trees.
for i in range(180):
    x,y=random.uniform(-2.4,4.5),random.uniform(.8,3.8)
    if inside(x,y):box('Fallen_petals',x,y,.062,.07,.10,.022,pick('pink'))

# Four small garden lights become warm pools at dusk in the runtime.
for x,y in [(-2.2,-1.3),(2.9,-2.3),(-2.6,1.4),(3.1,1.8)]:
    box('Lantern_posts',x,y,.3,.075,.075,.6,'6e6650')
    box('Lantern_glass',x,y,.64,.19,.19,.21,'ffe2a4')
    box('Lantern_caps',x,y,.78,.25,.25,.065,'797359')
