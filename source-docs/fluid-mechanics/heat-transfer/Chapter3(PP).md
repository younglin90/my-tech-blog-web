# Chapter3(PP)

> 원본: `heat-transfer/Chapter3(PP).pdf` (1.4MB, 46 페이지 추출)

## 페이지 1
Micro&Nano
Heat Transfer
LLabooragtoroy
CChhaapptteerr 33 OOnnee--DDiimmeennssiioonnaall
SStteeaaddyy--SSttaattee CCoonndduuccttiioonn
2007.
SSeeookk PPiill JJaanngg
MMiiccrroo && NNaannoo HHeeaatt TTrraannssffeerr LLaabb..
AAeerroossppaaccee aanndd MMeecchhaanniiccaall EEnnggiinneeeerriinngg
KKAAUU
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 2
Contents Micro&Nano
Heat Transfer
LLabooragtoroy
1. Treatment for Diffusion under One-Dimensional,
Steady-State Conditions
1. Concept of Thermal Resistance
2. Fin Theory
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 3
3.1 The Plane Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 4
3.1 The Plane Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Diffusion Equation
∂ ⎛ ∂T ⎞ ∂ ⎛ ∂T ⎞ ∂ ⎛ ∂T ⎞ ∂T
⎜k ⎟ + ⎜ ⎜k ⎟ ⎟ + ⎜k ⎟ + q & = ρC
p
∂x ⎝ ∂x ⎠ ∂y ⎝ ∂y ⎠ ∂z ⎝ ∂z ⎠ ∂t
Governing Equation
∂ ⎛ ∂T ⎞
⎜k ⎟ = 0 T(x) = C x + C
∂x ⎝ ∂x ⎠ 1 2
B.C. (cid:206) at x = 0 T(0) = T , at x = L T(L) = T
S,1 S,2
T −T
(cid:206) T(x) = S,2 S,1 x +T
S,1
L
Aerospace and Mechanical Engineering Hankuk Aviation University
Li Di t ib ti

## 페이지 5
3.1.1 The Plane Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Conduction Heat Transfer Rate
∂T T −T
q = −kA = kA S,1 S,2
x
∂x L
Heat Flux
T −T
S,1 S,2
q" = k
x
L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 6
3.1.2 Thermal Resistance Micro&Nano
Heat Transfer
LLabooragtoroy
∆T
Thermal Resistance is defined by R =
q
∂T ∆T
Thermal Resistance of Conductionq = −kA = kA
x
∂x ∆x
∆x L
(
R = =
R (cid:206) Heat Transfer Rate
t,cond.
kA kA t
q = hA(T − T ) = hA∆T
Thermal Resistance of Convection
x s ∞
1
R =
t,cond.
hA
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 7
3.1.2 Thermal Resistance Micro&Nano
Heat Transfer
LLabooragtoroy
Thermal Resistance of Radiation
q =εσA(T 4 − T 4 ) =εσA(T + T )(T 2 + T 2 )(T − T ) = h A(T − T )
s ∞ s ∞
x s ∞ s ∞ rad s ∞
where h =εσ(T + T )(T 2 + T 2 )
s ∞
rad s ∞
1
R =
t,rad.
h A
rad
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 8
3.1.3 The Composite Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Series Composite Wall (직렬)
R = R + R + R + R + R
tot 1 2 3 4 5
T −T
∞,1 ∞.4
q =
x
R
tot
T −T T −T T −T
q = ∞,1 s.1 = s,1 2 = 2 3
x
R R R
1 2 3
T −T T −T
3 s,4 s,4 ∞,4
= =
R R
4 5
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 9
3.1.3 The Composite Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Overall heat transfer coefficient, U (Conductance)
q = UA∆T
x
1
U =
R A
tot
1
R =
tot
UA
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 10
3.1.3 The Composite Wall Micro&Nano
Heat Transfer
LLabooragtoroy
Series-Parallel
In Parallel
1 1 1
= +
R R R
tot 1 2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 11
3.1.4 Contact Resistance Micro&Nano
Heat Transfer
LLabooragtoroy
T −T
R'' = A B
t,c q''
x
In composite systems, the temperature drop across the interface
between materials may be appreciable.
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 12
3.1.4 Contact Resistance Micro&Nano
Heat Transfer
LLabooragtoroy
T
∞
T
hot
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 13
3.1.4 Contact Resistance Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 14
3.2 An Alternative Conduction Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
dT
q = −kA(x) = const
x
dx
If k is function of T
dT
q = −k(T)A(x)
x
dx
By separation of variables
x T
1
q ∫ dx = ∫ − k(T)dT
x
A(x)
x T
O O
x T
dT q 1
q = −kA(x) x ∫ dx = ∫ dT
Otherwise
x dx k A(x)
x T
O O
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 15
3.2 An Alternative Conduction Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
Example
Circular Cross Section with D=0.25x
X =50mm, X =250mm
1 2
T1=400K, T2=600K
(a) Derive an expression for the temperature distribution T(x)
dT πD2 πa2
q = −kA where A = = x2
x
dx 4 4
By separation of variables
4q
x dx = −kdT
πa2x2
Integrating from x to any x within the cone
1
x T
4q 1
x ∫ dx = −k∫dT
πa2 x2
x T
1 1
Hence
4q ⎛ 1 1 ⎞
T(x) =T − x ⎜ − ⎟
1 πa2k ⎜ x x ⎟
⎝ ⎠
1
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 16
3.2 An Alternative Conduction Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
(b) Calculate the heat rate q through the cone
x
4q ⎛ 1 1 ⎞
T(x) =T − x ⎜ − ⎟
1 πa2k ⎜ x x ⎟
⎝ ⎠
1
4q ⎛ 1 1 ⎞
T =T − x ⎜ − ⎟
2 1 πa2k ⎜ x x ⎟
⎝ ⎠
1 1
πa2k(T −T )
q = 1 2
x [( ) ( )]
4 1/ x − 1/ x
1 2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 17
3.3 Radial Systems Micro&Nano
Heat Transfer
LLabooragtoroy
The Cylinder
Steady-State, No Heat Generation
1 d ⎛ dT ⎞
⎜kr ⎟ = 0
r dr ⎝ dr ⎠
k=const
T(r) = C lnr + C
1 2
B.C. T(r ) = T T(r ) = T
1 S,1 2 S,2
T −T ⎛ r ⎞
T(r) = S,1 S,2 ln⎜ ⎟ + T
⎜ ⎟
S,2
⎛ r ⎞ r
⎝ ⎠
ln⎜ 1 ⎟ 2
⎜ ⎟
r
⎝ ⎠
2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 18
3.3.1 The Cylinder Micro&Nano
Heat Transfer
LLabooragtoroy
Thermal Resistance
dT
q = −kA(r) where A(r) = 2πrL
x
dr
T −T T −T ∆T
q = −k2πL S,1 S,2 q = k2πL S,1 S,2 =
x x
⎛ r ⎞ ⎛ r ⎞ R
ln⎜ 1 ⎟ ln⎜ 2 ⎟ t
⎜ ⎟ ⎜ ⎟
r r
⎝ ⎠ ⎝ ⎠
2 1
ln(r / r )
R = 2 1
t,cond
2πkL
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 19
3.3.1 The Cylinder Micro&Nano
Heat Transfer
LLabooragtoroy
Critical Insulation Thickness
(a) Whether there exists an optimum insulation
Thickness that minimizes the heat transfer rate
ln(r / r ) 1
i
2πk 2πrh
T T
i ∞
ln(r / r ) 1 dR'
R' = i + tot = 0
tot
2πk 2πrh dr
1 1 k
Hence − = 0 r =
2πkr 2πr2h h
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 20
3.3.1 The Cylinder Micro&Nano
Heat Transfer
LLabooragtoroy
To determine whether the foregoing result maximizes or minimizes the total resistance
d2R'
tot > 0
dr2
k
r=
h
The optimum resistance thickness that minimizes the heat transfer rate does not exit
The critical insulation thickness that maximizes the heat transfer rate exits
k
r ≡ = 0.011m
cr
h
Hence r >r and heat transfer will increase with the addition of insulation up to
cr i
a thickness of
r − r = 0.011m −0.005m = 0.006m
cr i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 21
3.3.1 The Cylinder Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 22
3.3.2 The Sphere Micro&Nano
Heat Transfer
LLabooragtoroy
Steady-State, No Heat Generation
dT dT
q = −kA = −k(4πr2)
r
dr dr
r T
q 2 dr S,2
r ∫ = − ∫k(T)dT
4π r2
r T
1 S,1
4πk(T −T )
q = S,1 S,2
If k=const
r 1 1
−
r r
1 2
1 ⎛ 1 1 ⎞
Thermal Resistance R = ⎜ − ⎟
⎜ ⎟
t,cond.
4πk r r
⎝ ⎠
1 2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 23
3.5 Conduction with Thermal Energy Generation
Micro&Nano
Heat Transfer
LLabooragtoroy
Thermal Energy is being generated due to conversion from other energy
form such as electrical and chemical energy
Electrical Energy Thermal Energy
E& = I 2R = IV[W ]
g
E& IR
g
q ≡ =
&
V V
Film Heater
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 24
3.5.1 The Plane Wall Micro&Nano
Heat Transfer
LLabooragtoroy
G.E.: Diffusion Eq. (1Dim. Steady-State)
2
d T
k + q = 0
&
2
dx
q
where & : Energy Generation per Unit Vol.
q
&
T(x) = − x2 + C x + C
1 2
2k
B.C. T(−L) = T T(L) = T
s,1 s,2
qL2 ⎛ x2 ⎞ T −T x T + T
&
T(x) = ⎜1− ⎟ + s,2 s,1 + s,2 s,1
⎜ ⎟
2k L2 2 L 2
⎝ ⎠
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 25
3.5.1 The Plane Wall Micro&Nano
Heat Transfer
LLabooragtoroy
If B.C. are T = T = T
s,1 s,2 s
qL2 ⎛ x2 ⎞
&
T(x) = ⎜1− ⎟ +T
⎜ ⎟
2k L2 s
⎝ ⎠
(cid:206) Max. Temperature exists at the midplane
(cid:206) At midplane, Temperature gradient is zero
(cid:206) Adiabatic (No heat Transfer Crossover mid)
qL
&
q" = q" qL = h(T −T ) T = T +
&
Conv. Gen. s ∞ s ∞
h
qL2 ⎛ x2 ⎞ qL
& &
T(x) = ⎜1− ⎟ +T +
⎜ ⎟
2k L2 ∞ h
⎝ ⎠
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 26
3.5.2 Radial Systems Micro&Nano
Heat Transfer
LLabooragtoroy
G.E.: Diffusion Eq. (1Dim. Steady-State)
1 d ⎛ dT ⎞
⎜kr ⎟ + q = 0
&
r dr ⎝ dr ⎠
q
where & : Energy Generation per Unit Vol.
q
&
T(x) = − r2 + C lnr + C
1 2
4k
dT
B.C. = 0 T(r ) = T
o s
dr
r=0
Energy Balance at surface
qr
&
q" = q" qπr2L = h(2πr L)(T −T ) T = T + o
&
Conv. Gen. o o s ∞ s ∞ 2h
qr2 ⎛ r2 ⎞ qr
& &
T(x) = − o ⎜1− ⎟ +T + o
⎜ ⎟
4k r2 ∞ 2h
⎝ ⎠
o
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 27
3.6 Heat Transfer from Extended Surfaces Micro&Nano
Heat Transfer
LLabooragtoroy
Extended Surface is used to enhance the convection heat transfer
q = hA∆T
Conv.
Fin
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 28
3.6 Heat Transfer from Extended Surfaces Micro&Nano
Heat Transfer
LLabooragtoroy
Electronic Cooling Modules
Extended Surface: Fin
h ∆P A Cost
sf
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 29
3.6 Heat Transfer from Extended Surfaces Micro&Nano
Heat Transfer
LLabooragtoroy
Fin Configuration
Straight fin of uniform cross section Straight fin of nonuniform cross section
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 30
3.6 Heat Transfer from Extended Surfaces Micro&Nano
Heat Transfer
LLabooragtoroy
Fin Configuration
Pin fin
Annular fin
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 31
3.6.1 A General Conduction Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
One-Dimensional Assumption
Energy Balance
q = q + dq
x x+dx convection
where
dT
q = −kA
x C
dx
dq dT d ⎛ dT ⎞
q = q + x dx = −kA + ⎜− kA ⎟dx
x+dx x C C
dx dx dx ⎝ dx ⎠
dq = h(T −T )dA
conv. ∞ s
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 32
3.6.1 A General Conduction Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
Governing Equation
d ⎛ dT ⎞
⎜− kA ⎟dx + h(T −T )dA = 0
C ∞ s
dx ⎝ dx ⎠
Assumption
1) Constant Thermal Conductivity
2) Non-uniform Cross-sectional Area
d2T dA dT dA
− kA − k C + h(T −T ) s = 0
C dx2 dx dx ∞ dx
Dividing -kA
c
d2T 1 dA dT h dA
+ C − (T −T ) s = 0
dx2 A dx dx kA ∞ dx
C C
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 33
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
d2T 1 dA dT h dA
+ C − (T −T ) s = 0
dx2 A dx dx kA ∞ dx
C C
dA dA
C = 0 S = P
dx dx
d2T hP
− (T −T ) = 0
dx2 kA ∞
C
Let θ(x) = T(x) − T
∞
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 34
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
d 2θ hP
− m2θ= 0 where m 2 ≡
dx2 kA
C
mx −mx
θ= C e + C e
1 2
B.C. at x = 0 T = T θ=θ = T − T
b b b ∞
x = L
The Secondary Boundary Condition: At
Case A
dT
hA [T(L) − T ] = − kA
C ∞ C
dx
x=L
dθ
hθ(L) = − k
dx
x=L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 35
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
θ = C + C C =θ − C
b 1 2 2 b 1
h[C emL + (θ − C )e−mL] = −k[C memL − (θ − C )me−mL]
by Secondary B.C.
1 b 1 1 b 1
⎛ h ⎞
θe−mL − ⎜ ⎟θe−mL
kmθe−mL − hθe−mL b ⎝ km⎠ b
C = b b C =
1 h(emL − e−mL) + km(emL + e−mL) 1 ⎛ h ⎞
2⎜ ⎟sinh(mL) + 2cosh(mL)
⎝ km⎠
ex − e−x ex + e−x
where sinh(x) = cosh(x) =
2 2
θ cosh m(L − x) + (h / mk)sinh m(L − x)
=
θ cosh mL + (h / mk)sinh mL
b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 36
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
Total Heat Transfer Rate through the Fin
dT dθ
or q = ∫h(T(x) −T )dA = ∫hθ(x)dA
q = − kA = − kA
f ∞ s s
f C C
dx dx
x=0 x=0 A f A f
sinh mL + (h/mk)coshmL
q = hPkA θ
f C b
coshmL + (h/mk)sinh mL
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 37
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
x = L
The Secondary Boundary Condition: At
dθ
Case B Adiabatic Condition = 0
dx
x=L
θ cosh m(L − x)
= q = hPkA θ tanh mL
f C b
θ cosh mL
b
x = L
The Secondary Boundary Condition: At
Case C Constant Temperature θ(L) =θ
L
θ ( θ /θ ) sinh mx + sinh m(L − x) ( cosh mL −θ /θ )
= L b q = hPkA θ L b
f C b
θ sinh mL sinh mL
b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 38
3.6.2 Fins of Uniform Cross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
x = L
The Secondary Boundary Condition: At
θ(L) = 0 as L → ∞
Case D Infinite Fin
θ
= e−mx q = hPkA θ
f C b
θ
b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 39
3.6.3 Fin Performance Micro&Nano
Heat Transfer
LLabooragtoroy
Key Terminology I
ε
Fin Effective
f
(cid:206)The ratio of the fin heat transfer rate to the heat transfer rate
that would exist without the fin
q
f
ε ≡
f
hA θ
C,b b
Upper Limit of ε as L → ∞
f
Pk
q = hPkA θ ε ≡
f C b f hA
C,b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 40
3.6.3 Fin Performance Micro&Nano
Heat Transfer
LLabooragtoroy
Key Terminology II
Fin Resistance
θ
R = b
t, f
q
f
(cid:206)This result is extremely useful, particularly when representing a finned
surface by a thermal circuit
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 41
3.6.3 Fin Performance Micro&Nano
Heat Transfer
LLabooragtoroy
Key Terminology III
η
Fin Efficiency
(cid:206) The ratio of the fin heat transfer rate to the heat transfer rate
if the entire fin surface were at the base temperature
q q
f f
η ≡ =
f
q hA θ
f ,max f b
Ex: Adiabatic condition at the fin tip
q = hPkA θ tanh mL
hPkA tanhmL
f C b
η = C tanhmL =
f
hPL mL
q = hPLθ
f ,max b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 42
3.6.4 Fins of NonuniformCross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
d ⎛ dT ⎞
⎜− kA ⎟dx + h(T −T )dA = 0
C ∞ s
dx ⎝ dx ⎠
x → r A = 2πrt
C
d2T 1 dT
+ − m2(T −T ) = 0
dr2 r dr ∞
where m2 = 2h / kt
Let θ= T −T
∞
d2θ 1 dθ
+ − m2θ= 0
dr2 r dr
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 43
3.6.4 Fins of NonuniformCross-Sectional Area Micro&Nano
Heat Transfer
LLabooragtoroy
d2θ 1 dθ
+ − m2θ= 0 (Modified Bessel Equation of Order Zero)
dr2 r dr
θ(r) = C I (mr) + C K (mr)
1 O 2 O
I : Modified Zero-Order Bessel Function: 1st Kind
O
K : Modified Zero-Order Bessel Function: 2nd Kind
O
dθ
B.C. θ(r ) =θ = 0 (Adiabatic Condition)
1 b dr
r=r
2
dI (mr)
I (mr) = O
1
d(mr)
θ I (mr)K (mr ) + K (mr)I (mr )
= O 1 2 O 1 2
θ I (mr )K (mr ) + K (mr )I (mr ) dK (mr)
b O 1 1 2 O 1 1 2 K (mr) = − O
1
d(mr)
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 44
3.6.5 Overall Surface Efficiency Micro&Nano
Heat Transfer
LLabooragtoroy
η, Overall Surface Efficiency
ο
• Characterizes an Array of Fins and the Base Surface
q q
η = t = t
o
q hAθ
max t b
Where A = NA + A
t f b
⎡ NA ⎤
[ ] ( )
f
q = Nη hA θ + hAθ = h Nη A + (A − NA )θ = hA 1− 1−η θ
⎢ ⎥
t f f b b b f f t f b t f b
A
⎣ ⎦
t
NA
( )
f
η =1− 1−η
O f
A
t
q = hAηθ
t t O b
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 45
3.7 BoiheatEquation Micro&Nano
Heat Transfer
LLabooragtoroy
Two main phenomena that make heat transfer in living tissues more complex
than in conventional engineering materials
• Metabolic Heat Generation
• Perfusion Heat Generation:
(cid:206)the Exchange of Thermal Energy between Flowing Blood and
the Surrounding tissue
Conduction in Tissues
d 2T q & + q &
m p
+ = 0
dx2 k
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 46
3.7 BoiheatEquation Micro&Nano
Heat Transfer
LLabooragtoroy
Tissue
T
T
a
q = wρc (T −T)
&
p b a
Where w (m3/s) volumetric blood flow per m3 of tissue
Aerospace and Mechanical Engineering Hankuk Aviation University
