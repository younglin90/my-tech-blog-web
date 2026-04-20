# Chapter9(PP)

> 원본: `heat-transfer/Chapter9(PP).pdf` (0.5MB, 21 페이지 추출)

## 페이지 1
Micro&Nano
Heat Transfer
LLabooragtoroy
CChhaapptteerr 99 FFrreeee CCoonnvveeccttiioonn
2007
SSeeookk PPiill JJaanngg
MMiiccrroo && NNaannoo HHeeaatt TTrraannssffeerr LLaabb..
AAeerroossppaaccee aanndd MMeecchhaanniiccaall EEnnggiinneeeerriinngg
KKAAUU
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 2
Free Convection Micro&Nano
Heat Transfer
LLabooragtoroy
• Physical Meanings of Free Convection
• Governing Equation
• Boussinesq Approximation
• Empirical Correlations
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 3
9.1 Physical Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Forced Convection
External Forcing Conditions (Use of Fans or Pumps)
U L
External Flow Nu~CRemPrn where Re = ∞
ν
Developing Nu~CRemPrn
Laminar Flow
Developed Nu=4.36 Nu=3.66
Internal Flow
Shah and London
Turbulent Flow Nu~CRemPrn Dittus-Boelter Eq.
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 4
9.1 Physical Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Free Convection
Body Force acts on a fluid
in which there are density gradients because of temperature difference
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 5
9.1 Physical Considerations Micro&Nano
Heat Transfer
LLabooragtoroy
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 6
9.2 The Governing Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Assumption
• Steady-state
• Two dimension
• Constant property conditions
• Boussinesq Approximation
• Boundary Layer Approximation
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 7
9.2 The Governing Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Boussinesq Approximation
Volumetric Thermal Expansion Coefficient
1 ⎛ ∂ρ⎞ 1 ρ −ρ
β≡ − ⎜ ⎟ ≈ − ∞ ρ −ρ= ρβ(T −T )
∞ ∞
ρ⎝ ∂T ⎠ ρT −T
P ∞
1 ⎛ ∂ρ⎞ 1 P 1
where perfect gas has β≡ − ⎜ ⎟ = =
ρ⎝ ∂T ⎠ ρRT2 T
P
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 8
9.2 The Governing Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Boussinesq Approximation
Governing Equation
X-momentum
∂u ∂u 1 ∂P ∂2u
u + v = − − g +ν
∂x ∂x ρ∂x ∂y2
Y-momentum
∂v ∂v 1 ∂P ∂2v
u + v = − +ν
∂x ∂x ρ∂y ∂x2
∂P
0 =
∂y
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 9
9.2 The Governing Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Outside the Boundary Layer
∂P
u=0, = −ρ g
∞
∂x
∂u ∂u 1 ∂P ∂2u
u + v = − − g +ν
∂x ∂x ρ∂x ∂y2
∂u ∂u g ∂2u
∴u + v = (ρ −ρ) +ν
⎛∂p⎞
⎜ ⎟
∂x ∂x ρ ∞ ∂y2 ⎝∂x⎠
in_BL
⎛∂p⎞
⎜ ⎟
⎝∂x⎠
g out_BL
By using Boussinesq Approximation (ρ −ρ) = gβ(T −T )
∞ ∞
ρ
∂u ∂u ∂2u 1
∴u + v = gβ(T −T ) +ν where β=
∂x ∂x ∞ ∂y2 T
f
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 10
9.2 The Governing Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Governing Equation
X-momentum
∂u ∂u ∂2u
∴u + v = gβ(T −T ) +ν
∂x ∂x ∞ ∂y2
Continuity
∂u ∂v
+ = 0
∂x ∂x
Energy Equation
∂T ∂T ∂2T
u + v =α
∂x ∂y ∂y2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 11
9.3 Similarity Solutions Micro&Nano
Heat Transfer
LLabooragtoroy
gβ ( T −T ) L3 Buoyancy Force
Gr = s ∞ ~
ν3 Viscous Force
Similarity Solution
1/4
hx ⎛ Gr ⎞
( )
Nu = = ⎜ x ⎟ g Pr
x
k ⎝ 4 ⎠
0.75Pr1/2
( )
g Pr =
( )1/4
0.609+1.221Pr1/2+1.238Pr
1/4
hL 4 ⎛ Gr ⎞
( )
Nu = = ⎜ L ⎟ g Pr
L
k 3 ⎝ 4 ⎠
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 12
9.4 The Effects of Turbulence Micro&Nano
Heat Transfer
LLabooragtoroy
Transition in a natural convection boundary layer depends on
the relative magnitude of the buoyancy and viscous forces in the fluid
Rayleigh Number
gβ(T −T )x3
Ra = Gr Pr = s ∞ ≈109
x,c x,c
να
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 13
9.5 Empirical Correlations Micro&Nano
Heat Transfer
LLabooragtoroy
1
where m = for Laminar
hL
4
Nu = = CRam
L L
k
f
1
m = for Turbulent
3
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 14
9.5 Empirical Correlations Micro&Nano
Heat Transfer
LLabooragtoroy
Vertical Plate
hL
Nu = = 0.59Ra1/4 (104 ≤ Ra ≤109) for Laminar
L L L
k
f
hL
Nu = = 0.10Ra1/3 (109 ≤ Ra ≤1013) for Turbulence
L L L
k
f
Churchill and Chu
2
⎧ ⎫
⎪
0.387Ra1/6
⎪
Nu = 0.825+ L for Entire Region
⎨ ⎬
L [ ]
8/27
⎪ 1+
(
0.492/ Pr
)9/16
⎪
⎩ ⎭
0.670Ra1/4
Nu = 0.68+ L Ra ≤109
L [ ]
( )9/16 4/9 L
1+ 0.492/ Pr
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 15
9.5 Empirical Correlations Micro&Nano
Heat Transfer
LLabooragtoroy
Inclined and Horizontal Plates
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 16
9.5 Empirical Correlations Micro&Nano
Heat Transfer
LLabooragtoroy
Upper Surface of Heated Plate or Lower Surface of Cooled Plate
Nu = 0.54Ra1/4 104 ≤ Ra ≤107
L L L
Nu = 0.15Ra1/4 107 ≤ Ra ≤1011
L L
L
A
L ≡ s
P
Lower Surface of Heated Plated or Upper Surface of Cooled Plate
Nu = 0.27Ra1/4 105 ≤ Ra ≤1010
L
L L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 17
9.5 Empirical Correlations Micro&Nano
Heat Transfer
LLabooragtoroy
n
Nu = CRa
D
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 18
9.6 Free Convection within Parallel Plate Channel Micro&Nano
Heat Transfer
LLabooragtoroy
Elenbass
3/4
1 ⎛ S ⎞ ⎧ ⎡ 35 ⎤⎫
Nu L = Ra ⎜ ⎟⎨1−exp ⎢ − ⎥⎬
s
24 ⎝ L ⎠ ⎩ ⎣ Ra (S / L) ⎦⎭
s
⎛ q/ A ⎞ S gβ ( T −T ) S3
Nu = ⎜ ⎟ Ra = s ∞
s ⎜ ⎟
T −T k S αν
⎝ ⎠
s ∞
S
10−1 ≤ Ra ≤105
S
L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 19
9.7 Empirical Correlations: Enclosure Micro&Nano
Heat Transfer
LLabooragtoroy
Rectangular Cavity
gβ∆TL3
τ= 0
Ra ≡ >1708
L,Critical
αν
Buoyancy forces can overcome the resistance imposed by viscous force
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 20
9.7 Empirical Correlations: Enclosure Micro&Nano
Heat Transfer
LLabooragtoroy
1708 ≤ Ra ≤ 5×104
L
Fluid motion consists of regularly spaced roll cells (Benard Cell)
hL
Nu = = 0.069Ra1/3 Pr0.074 3×105 ≤ Ra ≤ 7×109
L
L L
k
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 21
9.7 Empirical Correlations: Enclosure Micro&Nano
Heat Transfer
LLabooragtoroy
τ= 90o
Aerospace and Mechanical Engineering Hankuk Aviation University
