# Chapter8(PP)

> 원본: `heat-transfer/Chapter8(PP).pdf` (1.0MB, 38 페이지 추출)

## 페이지 1
Micro&Nano
Heat Transfer
LLabooragtoroy
CChhaapptteerr 88 IInntteerrnnaall FFllooww
2007
SSeeookk PPiill JJaanngg
MMiiccrroo && NNaannoo HHeeaatt TTrraannssffeerr LLaabb..
AAeerroossppaaccee aanndd MMeecchhaanniiccaall EEnnggiinneeeerriinngg
KKAAUU
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 2
Internal Flow Micro&Nano
Heat Transfer
LLabooragtoroy
• Developing and Developed Region
• Mean Temperature (Bulk Mean Temperature)
• Constant Temperature and Heat Flux Conditions
• Entry Region
• Turbulent Flow
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 3
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Flow Conditions
External Flow: Laminar or Turbulent Flow
Internal Flow: (Laminar or Turbulent Flow)
+ Entrance (Developing) or Fully Developed Flow
ρu D
Re = m
D
µ
⎛ x ⎞
⎜ fd,h ⎟ ≅ 0.05Re
⎜ ⎟
D
D
⎝ ⎠
lam
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 4
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Mean Velocity
m = ρu A
&
m C
m = ∫ρu(r, x)dA
&
A
C
r r
1 1 1 o 2π o
u = ∫ρu(r, x)dA = ∫u(r, x)dA = ∫u(r, x)2πrdr = ∫u(r, x)rdr
m ρA c A c πr2 r2
C A C A o 0 o 0
C C
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 5
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Velocity Profile in the Fully Developed Region
(cid:206) Hagen-Poiseuille Flow
∂u
Fully Developed Region: = 0 v = 0
∂x
Rectangular Coordinate: (2D)
∂u ∂u 1 dp ⎡∂2u ∂2u ⎤
u + v = − +ν +
⎢ ⎥
∂x ∂y ρ dx ∂y2 ∂x2
⎣ ⎦
Cylindrical Coordinate: (3D)
∂u ∂u 1 dp ⎡1 ∂ ⎛ ∂u ⎞ ∂2u ⎤
u + v = − +ν ⎜r ⎟ +
⎢ ⎥
∂x ∂r ρ dx ⎣ r ∂r ⎝ ∂r ⎠ ∂x2 ⎦
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 6
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Rectangular Coordinate: (2D)
∂2u 1 dp
D
=
∂y2 µdx
At x = D/2 u = 0
∂u
At x = 0 = 0
∂y
⎡ 2 ⎤
1 ⎛ dP ⎞ ⎛ D ⎞
u = ⎜− ⎟⎢⎜ ⎟ − y2 ⎥
2µ⎝ dx ⎠⎢⎝ 2 ⎠ ⎥
⎣ ⎦
1 D 1 ⎛ dP ⎞ D2 u 3 ⎡ ⎛ y ⎞ 2⎤
u = ∫ 2 udy = ⎜− ⎟ = ⎢1−⎜ ⎟ ⎥
m D
D − 3µ⎝ dx ⎠ 4 u 2 ⎢ ⎝ D / 2 ⎠ ⎥
⎣ ⎦
2 m
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 7
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Cylindrical Coordinate: (3D)
1 ∂ ⎛ ∂u ⎞ 1 dp
⎜r ⎟ =
r ∂r ⎝ ∂r ⎠ µdx
At r = r u = 0
o
∂u
At r = 0 = 0
∂r
r=0
⎡ 2⎤
1 ⎛ dP ⎞ ⎛ r ⎞
u(r) = − ⎜ ⎟r2⎢1− ⎜ ⎟ ⎥
⎜ ⎟
o
4µ⎝ dx ⎠ ⎢ ⎝ r ⎠ ⎥
⎣ o ⎦
1 1 dP u ⎡ ⎛ r ⎞ 2⎤
u = ∫u(r, x)dA = − r2 = 2⎢1− ⎜ ⎟ ⎥
m c o ⎜ ⎟
A 8µ dx u r
⎢ ⎝ ⎠ ⎥
C A m ⎣ o ⎦
C
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 8
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
2.2
Rectangular Coordinate: (2D)
2.0
Cylindrical Coordinate: (3D)
1.8
1.6
1.4
1.2
u/u
1.0
m
0.8
0.6
0.4
0.2
0.0
0.0 0.2 0.4 0.6 0.8 1.0
y/D/2 or r/r
o
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 9
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Pressure Gradient and Friction Factor
Moody Friction Factor
∆P dP
D − D
L ρu2
L dx
∆P = f m f = =
D 2 ρu2 ρu2
m m
2 2
1 1 dP
dP
u = ∫u(r, x)dA = − r2 − D2 = u 32µ
m A c 8µ o dx dx m
C A
C
∆P dP dP
D − D − D2
u 32µ 64 64
L dx dx
f = = = = m = =
ρu2 ρu2 ρu2 D ρu2 D ρu D Re
m m m m m D
2 2 2 2 µ
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 10
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Friction Coefficient
∂u 4u
−µ µ m
τ ∂r r 16 16 f
C ≡ s = r=0 = o = = =
f ρu2 ρu2 ρu2 ρu D Re 4
m m m m D
2 2 2 µ
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 11
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
What do you measure to obtain the Moody friction factor?
∆P dP
D − D
L dx
f = =
ρu2 ρu2
m m
2 2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 12
8.1 Hydrodynamic Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
0.8
0.7
o
Temperature : 21 C, Diameter : 1.812mm
0.6
Theoretical Results (64 / Re )
D
0.5
Water
Water + Al O (0.01%)
0.4 2 3
Water + Al O (0.02%)
2 3
Water + Al O (0.03%)
0.3
2 3
Water + Al O (0.1%)
2 3
Water + Al O (0.2%)
2 3
0.2
Water + Al O (0.3%)
2 3
0.1
350 400 450 500 550 600 650
Aerospace and Mechanical Engineering Hankuk Aviation University
f
,rotcaf
noitcirF
Reynolds number, Re
D

## 페이지 13
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
δ x x x
Pr ~ ~ fd,t x ~ x Pr fd,t ~ fd,h Pr ≅ 0.05Re Pr
fd,t fd,h D
δ x D D
t fd,h
Turbulent: Conditions are nearly independent of Pr
x
fd,t
≅ 10
D
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 14
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Mean Temperature (Bulk Mean Temperature)
Transport Energy: E& ≡ mC T
&
t p m
Where T is mean (bulk mean) temperature.
m
r
1 1 o
Circular Tube T = ∫uTdA = ∫uT 2πrdr
m u A C u πr2
m C A m o 0
C
T T
m,in m,out
q = mc (T −T ) = mc (T −T )
& &
p m,out m,in p m,out in
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 15
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Newton’s Law of Cooling
q" = h(T − T )
S s m
where h is local convection heat transfer coefficient
q" = h(T −T )
S s m
T T
m,in m,out
L
q = mc (T −T ) = mc (T −T ) = ∫ h(x)(T (x) −T (x))2πr dx
& &
p m,out m,in p m,out in s m o
0
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 16
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Fully Developed Conditions
∂u
Fully Developed Region: = 0 v = 0
∂x
T −T
Fully Developed Condition: S becomes independent of x
T −T
S m
∂ ⎡ T −T ⎤
s = 0
⎢ ⎥
∂x T −T
⎣ ⎦
s m fd,t
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 17
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Fully Developed Condition:
⎛ ∂T ⎞
q"
− ⎜ ⎟
− s
∂ ⎡ T −T ⎤ ⎝ ∂r ⎠ k h hD
s = r=r o = ≠ f (x) ≠ f (x) Nu = ≠ f (x)
⎢ ⎥
∂r T −T T −T q" k k
⎣ ⎦
s m r=r s m s
o
h
Nusselt Number is constant at fully developed conditions
Equation is not satisfied in the entrance region
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 18
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Why does the local heat transfer coefficient is enhanced at the
entry region compare with that at fully developed region?
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 19
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Uniform Surface Flux (Constant Heat Flux)
Physical Meanings of Fully Developed Condition
dT dT
q" = h(T −T ) s = m
S S m
dx dx
fd,t fd,t
⎡∂T ∂T ⎤
s (T −T ) − (T −T) s
∂ ⎡ T −T ⎤ ⎢ s m s 1 ∂T (T −T) ∂T ⎥
∂x ∂x
s = 0 − + s m = 0
⎢ ⎥ ⎢ ⎥
∂x T −T (T −T )2 (T −T ) ∂x (T −T )2 ∂x
⎣ ⎦ ⎢ s m s m s m ⎥
s m fd,t
⎣ ⎦
fd,t
∂T ∂T (T −T) ∂T (T −T) ∂T
= s − s s + s m
∂x ∂x (T −T ) ∂x (T −T ) ∂x
fd,t fd,t s m fd,t s m fd,t
∂T ∂T ∂T
= m = s
∂x ∂x ∂x
fd,t fd,t fd,t
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 20
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 21
8.2 Thermal Consideration Micro&Nano
Heat Transfer
LLabooragtoroy
Constant Surface Temperature
∂T ∂T (T − T) ∂T (T − T) ∂T
= s − s s + s m
∂x ∂x (T − T ) ∂x (T − T ) ∂x
fd,t fd,t s m fd,t s m fd,t
∂T (T − T ) ∂T
= s m
∂x (T − T ) ∂x
fd,t s m
fd,t
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 22
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
dq = mC dT
&
conv p m
For the Entire Tube q = m & C (T − T )
conv p m,o m,i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 23
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
Uniform Surface Flux (Constant Heat Flux)
q" Px = mC (T − T )
&
s p m,x m,i
dT q" P P
m = s = constant = h(T −T )
s m
dx mC mC
& &
p p
q" P
T (x) = T + s x
m m,i
mC
&
p
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 24
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
Constant Surface Temperature
dT q" P
m = s ≠ constant
dx mC
&
p
( )
Let ∆T ≡ T − T d ∆T = −dT
s m m
( )
dT d ∆T P
m = − = h∆T
dx dx mC
&
p
∆T ( ) L
o d ∆T PL 1
∫ = − ∫ hdx
∆T mC L
&
∆T p 0
i
T − T ⎛ PL ⎞
∆T PL s m,o = exp ⎜ − h ⎟
ln o = − h ⎜ L ⎟
∆T m & C L T s − T m,i ⎝ m & C p ⎠
i p
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 25
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
( ) ( )
q = mC (T − T ) = mC ( T − T − T − T ) = mC (∆T − ∆T )
& & &
conv p m,o m,i p s m,i s m,o p i o
∆T − ∆T
q = mC (∆T − ∆T ) = h PL o i = h A ∆T
&
conv p i o L L s lm
ln(∆T / ∆T )
o i
∆T − ∆T
Where ∆T = o i is log mean temperature difference
lm
ln(∆T / ∆T )
o i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 26
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
In many applications, it is temperature of an external fluid,
rather than the tube surface temperature, that is fixed.
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 27
8.3 Energy Balance Micro&Nano
Heat Transfer
LLabooragtoroy
T −T ⎛ PL ⎞
∞ m,o = exp ⎜ − U ⎟
⎜ ⎟
T −T mC
&
⎝ ⎠
∞ m,i p
q = UA ∆T
conv s lm
∆T 1
U is the average overall heat transfer coefficient, q ≡ AU∆T = U =
R AR
tot tot
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 28
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Fully Developed Region
∂T ∂T 1 ∂ ⎛ ∂T ⎞ ∂2T
u + v =α ⎜r ⎟+α
∂x ∂y r ∂r ⎝ ∂r ⎠ ∂y2
∂T 1 ∂ ⎛ ∂T ⎞
u =α ⎜r ⎟
∂x r ∂r ⎝ ∂r ⎠
Uniform Surface Flux (Constant Heat Flux)
⎡ 2⎤
u ⎛ r ⎞
∂T ∂T ∂T
= 2⎢1−⎜ ⎟ ⎥
= m = s
⎜ ⎟
∂x ∂x ∂x u ⎢ ⎝ r ⎠ ⎥
m ⎣ o ⎦
fd,t fd,t fd,t
⎡ 2⎤
2u ⎛ ∂T ⎞ ⎛ r ⎞ 1 ∂ ⎛ ∂T ⎞
m ⎜ m ⎟⎢1−⎜ ⎟ ⎥ = ⎜r ⎟
⎜ ⎟
α ⎝ ∂x ⎠⎢ ⎝ r ⎠ ⎥ r ∂r ⎝ ∂r ⎠
⎣ o ⎦
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 29
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Separating variables and integrating twice, the temperature distribution can
be obtained by
2u ⎛ dT ⎞⎡r2 r4 ⎤
T(r, x) = m ⎜ m ⎟ − +C lnr +C
⎢ ⎥
α ⎝ dx ⎠⎣ 4 16r2 ⎦ 1 2
o
B.C. ∂T
At r = 0, = 0
∂y
At r = r , T = T
o s
⎡ 4 2⎤
2u r2 ⎛ dT ⎞ 3 1 ⎛ r ⎞ 1 ⎛ r ⎞
T(r, x) = T (x) − m o ⎜ m ⎟⎢ + ⎜ ⎟ − ⎜ ⎟ ⎥
⎜ ⎟ ⎜ ⎟
s
α ⎝ dx ⎠⎢16 16 ⎝ r ⎠ 4 ⎝ r ⎠ ⎥
⎣ o o ⎦
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 30
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
r
1 1 o
T = ∫uTdA = ∫uT 2πrdr
m u A C u πr2
m C A m o 0
C
11 ⎛ u r2 ⎞⎛ dT ⎞
T = T (x) − ⎜ m o ⎟⎜ m ⎟
⎜ ⎟
m s
48 ⎝ α ⎠⎝ dx ⎠
dT q''P
dq = m = s ≠ f (x)
conv
dx mC
&
p
dq = mC dT = q''Pdx
&
conv p m s
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 31
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
11 ⎛ q" D ⎞
T = T (x) − ⎜ s ⎟
m s
48 ⎝ k ⎠
q" 11 ⎛ q" D ⎞
T (x) −T = s = ⎜ s ⎟
s m
h 48 ⎝ k ⎠
k 48
h =
D 11
hD
Nu = = 4.36
k
Constant Surface Temperature
hD
Nu = = 3.66
k
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 32
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Entry Region
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 33
8.4 Laminar Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Thermal Entry Length: Thermal Entry Region
Combined Entry Length: Thermal and Velocity Entry Region
Sieder and Tate
0.6 ≤ Pr ≤ 5
1/3 0.144
⎛ Re Pr ⎞ ⎛ µ⎞ ⎛ µ⎞
Nu =1.86⎜ D ⎟ ⎜ ⎟ 0.0044 ≤ ⎜ ⎟ ≤ 9.75
D ⎜ ⎟ ⎜ ⎟
⎝ L / D ⎠ ⎝ µ ⎠ ⎝ µ ⎠
s s
Shah and London
[ ( )]
( )
⎧1.302x−1/3 −1, x ≤ 0.00005 x = x / d / Re Pr
* * * tube d tube
⎪
1.302x−1/3 − 0.5, 0.00005 ≤ x ≤ 0.0015
⎪
* *
Nu =
⎨
x ( )
⎪4.364 + 8.68 103 x −0.506 exp ( − 41x )
* *
⎪
x ≥ 0.001
⎩
*
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 34
8.5 Turbulent Flow in Circular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Convection Correlations: Turbulent Flow and Circular Tubes
Local Nusselt number for fully developed (hydrodynamically and thermally)
turbulent flow in a smooth circular tube
Colburn Equation: Nu = 0.023Re4/5 Pr1/3
D D
4/5 n
Dittus-Boelter Equation: Nu = 0.023Re Pr
D D
N=0.4 for heating (T >T ) 0.7 ≤ Pr ≤160
s m
L
0.3 for cooling (T <T ) Re ≥10,000 ≥10
s m D
D
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 35
8.6 Noncircular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Hydraulic Diameter
4A
D ≡ C
h
P
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 36
8.6 Noncircular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
Concentric Tube Annulus
q" = h (T − T )
i i s,i m
q" = h (T − T )
o o s,o m
h D 4A
h D
Nu ≡ o h D = C = D − D
Nu ≡ i h
i k o k h P o i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 37
8.6 Noncircular Tubes Micro&Nano
Heat Transfer
LLabooragtoroy
If uniform heat flux conditions exist at both surface
Nu Nu
Nu = ii Nu = oo
i 1− (q "/ q ")θ* o 1− (q "/ q ")θ*
o i i o i o
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 38
8.7 Heat Transfer Enhancement Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University
