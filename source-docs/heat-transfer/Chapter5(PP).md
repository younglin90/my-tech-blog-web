# Chapter5(PP)

> 원본: `heat-transfer/Chapter5(PP).pdf` (0.3MB, 21 페이지 추출)

## 페이지 1
Micro&Nano
Heat Transfer
LLabooragtoroy
CChhaapptteerr 55 TTrraannssiieenntt CCoonndduuccttiioonn
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
1. Lumped Capacitance Method
2. Semi-Infinite Solid
3. Finite-Difference Method
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 3
5.1 The Lumped Capacitance Method Micro&Nano
Heat Transfer
LLabooragtoroy
The temperature of solid is essentially spatially uniform
(Internally, infinite thermal conductivity)
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 4
5.1 The Lumped Capacitance Method Micro&Nano
Heat Transfer
LLabooragtoroy
Overall Energy Balance on the Solid
− E& = E&
out sys
dT
− hA (T −T ) = ρVC
s ∞ p
dt
dθ t ρVC θ dθ
Let θ≡ T −T Then − hAθ= ρVC − ∫dt = p ∫
∞ s p dt
hA θ
0 s θ
i
Where θ = T −T at t=0
i i ∞
ρVC θ θ ⎡ ⎛ hA ⎞ ⎤ ⎡ ⎛ 1 ⎞ ⎤
p ln i = t = exp⎢− ⎜ s ⎟ t⎥ = exp
⎢
− ⎜ ⎟t
⎥
⎜ ⎟ ⎜ ⎟
hA θ θ ρVC τ
s i ⎢ ⎣ ⎝ p ⎠ ⎥ ⎦ ⎣ ⎝ t ⎠ ⎦
ρVC
p
Where τ = thermal time constant [sec]
t
hA
s
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 5
5.1 The Lumped Capacitance Method Micro&Nano
Heat Transfer
LLabooragtoroy
Total Energy Transfer, Q
t t
Q = ∫qdt = hA ∫θdt
s
0 0
⎡ t ⎤
( )
= ρVC θ 1− exp(− )
⎢ ⎥
p i
τ
⎣ ⎦
t
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 6
5.2 Validity Micro&Nano
Heat Transfer
LLabooragtoroy
Thermal Resistance of Conduction << Thermal Resistance of Convection
( Validity of Lumped Capacitance Method)
Under steady-state Condition
kA
( )
T −T = hA(T −T )
S,1 S,2 S,2 ∞
L
T −T L/kA R
S,1 S,2 = = Cond <<1
T −T 1/hA R
S,2 ∞ Conv
R hL
Bi = Cond = <<1
R k
Conv
Where Bi is Biot number
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 7
5.2 Validity Micro&Nano
Heat Transfer
LLabooragtoroy
Bi<<1: Assume a uniform temperature distribution
hL
Bi = C < 0.1 can be considered as a lumped system
k
V
Where L ≡ characteristic length
C
A
S
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 8
5.2 Validity Micro&Nano
Heat Transfer
LLabooragtoroy
θ ⎡ ⎛ hA ⎞ ⎤
= exp⎢− ⎜ s ⎟ t⎥ = exp [ − Bi ⋅ Fo ]
⎜ ⎟
θ ρVC
i ⎢ ⎣ ⎝ p ⎠ ⎥ ⎦
αt k Transport Property
Where Fo = α= ~ is Fourier Number
2
L ρC Thermodynamic Property
C p
Dimensionless Time
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 9
5.3 General Lumped Capacitance Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
Applying Conservation Energy at Any Instant t
dT
q ''A + E& − (q'' +q'' )A = ρVC
s s(h) g conv rad s(c,r)
dt
[ ] dT
q ''A + E& − h(T −T ) +εσ(T4 −T4 ) A = ρVC
s s(h) g ∞ sur s(c,r)
dt
Non-Linear, First-Order,
Non-homogeneous,
Ordinary Differential Equation.
Case1 q ''= 0 E& = 0 h(T −T ) <<εσ(T 4 −T 4)
s g ∞ ∞
dT
Then ρVC = −εσ(T 4 −T 4 )A
sur s(c,r)
dt
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 10
5.3 General Lumped Capacitance Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
εσA t T 1
s(c,r) ∫dt = −∫ dT
ρVC (T 4 −T 4 )
0 T sur
i
IF Radiation to Deep Space T ≈ 0
sur
εσA t T 1 ρVC ⎛ 1 1 ⎞
s(c,r) ∫dt = −∫ dT t = ⎜ − ⎟
⎜ ⎟
ρVC (T 4) 3εA σ T3 T3
⎝ ⎠
0 T s(c,r) i
i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 11
5.3 General Lumped Capacitance Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
Case 2 Radiation is neglected and h is constant
dT
q ''A + E& − h(T −T )A = ρVC
s s(h) g ∞ s(c,r)
dt
Let θ= T −T
∞
dθ 1 [ ]
+ hA θ= q '' A + E&
s(c,r) s s(h) g
dt ρVC
dθ
+αθ= β
dt
β
Let Ω =θ−
dΩ
α
+αΩ = 0
dt
Ω t
1
β β
∫ dΩ = −∫αdt where Ω'=θ − Ω =θ−
Ω i α α
Ω' 0
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 12
5.3 General Lumped Capacitance Analysis Micro&Nano
Heat Transfer
LLabooragtoroy
Ω T −T −β/α
= exp(−at) ∞ = exp(−at)
Ω' T −T −β/α
i ∞
5.4 ~ 5.6 The Plane Wall with Convection
Separation of Variables
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 13
5.7 The Semi-Infinite Solid Micro&Nano
Heat Transfer
LLabooragtoroy
Transient temperature distributions in a semi-infinite solid for three surface conditions
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 14
5.7 The Semi-Infinite Solid Micro&Nano
Heat Transfer
LLabooragtoroy
G.E.
∂2T 1 ∂T x
= Similarity Variables η≡
∂x2 α ∂t (4αt)1/2
What is similarity Variable? (P.D.E. (cid:206) O.D.E.)
∂T ∂T ∂η 1 dT
= =
∂x ∂η ∂x (4αt)1/2 dη
∂2T ∂ ⎡∂T ⎤ ∂η 1 d2T
= =
⎢ ⎥
∂x2 ∂η⎣ ∂x ⎦ ∂x (4αt) dη2
∂T ∂T ∂η x dT
= = −
∂t ∂η ∂t 2t(4αt)1/2 dη
∂2T 1 ∂T d2T dT
= = −2η B.C. T(η= 0) = T
∂x2 α ∂t dη2 dη S
T(η→ ∞,t = 0) = T
i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 15
5.7 The Semi-Infinite Solid Micro&Nano
Heat Transfer
LLabooragtoroy
Solving Procedure
d ⎛ dT ⎞ ⎛ dT ⎞
⎜ ⎟ d⎜ ⎟
⎜ ⎟ ⎜ ⎟
dη ⎝ dη ⎠ ⎝ dη ⎠
= −2η = −2ηdη
dT dT
dη dη
Integrating, it follows that ln(dT /dη) = −η2 + C '
1
dT
= C exp(−η2)
1
dη
η
T = C ∫exp(−η2)dη+ C
1 2
0
η
T(η= 0) = T C = T T = C ∫exp(−η2)dη+T
S 2 s 1 s
0
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 16
5.7 The Semi-Infinite Solid Micro&Nano
Heat Transfer
LLabooragtoroy
Secondary Boundary Condition
T(η→ ∞,t = 0) = T
i
∞
T −T
T = C ∫exp(−η2)dη+T C = i s
i 1 s 1 ∞
0 ∫exp(−η2)dη
0
∞ π1/2
2
(
T −T
)
Error function ∫exp(−η2)dη= C = i s
2 1 π1/2
0
( )η
2 T −T
T = i s ∫exp(−η2)dη+T
π1/2 s
0
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 17
5.9 Finite Difference Method Micro&Nano
Heat Transfer
LLabooragtoroy
5.9.1 Discretization of the heat equation: The explicit method
1 ∂T ∂2T ∂2T
= +
α ∂t ∂x2 ∂y2
∂T T P+1 −T P
Time ≈ m,n m,n
∂t ∆t
m,n
∆x = ∆y
Explicit Method of Solution
(cid:206) Temperatures are evaluated at the previous time (P)
1 T P+1 −T P T P + T P − 2T P T P + T P − 2T P
m,n m,n = m+1,n m−1,n m,n + m,n+1 m,n−1 m,n
α ∆t ∆x2 ∆y2
Where ∆x = ∆y
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 18
5.9 Finite Difference Method Micro&Nano
Heat Transfer
LLabooragtoroy
T P+1 = F (T P +T P +T P +T P ) + (1− 4F )T P
m,n O m+1,n m−1,n m,n+1 m,n−1 O m,n
where F =α∆t /(∆x)2
O
For the One-dimensional case
T P+1 = F (T P + T P ) + (1− 2F )T P
m,n O m+1,n m−1,n O m,n
Explicit Method: Not conditionally stable
Stability Criterion: Coefficient ≥ 0
1-D Case: 1− 2F ≥ 0
O
2-D Case: 1− 4F ≥ 0
O
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 19
5.9 Finite Difference Method Micro&Nano
Heat Transfer
LLabooragtoroy
Discretization equation may be derived by applying the energy balance method
E& + E& = E&
in g sys
kA ∆x T P+1 −T P
hA(T −T P) + (T P −T P) = ρCA o o
∞ o 1 o
∆x 2 ∆t
2h ∆t 2α∆t
T P+1 = (T −T P) + (T P −T P) +T P
o ρC ∆x ∞ o (∆x)2 1 o o
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 20
5.9 Finite Difference Method Micro&Nano
Heat Transfer
LLabooragtoroy
2h ∆t h∆x k ∆t
Where = 2 = 2BiF
ρC ∆x k ρC (∆x)2 O
T P+1 = 2F (T P + BiT ) + (1− 2F − 2BiF )T P
o O 1 ∞ O O o
Stability Criterion: 1− 2F − 2BiF ≥ 0
O O
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 21
5.9 Finite Difference Method Micro&Nano
Heat Transfer
LLabooragtoroy
5.9.2 Discretization of the heat equation: The implicit method
1 ∂T ∂2T ∂2T
= +
α ∂t ∂x2 ∂y2
1 T P+1 −T P T P+1 +T P+1 − 2T P+1 T P+1 +T P+1 − 2T P+1
m,n m,n = m+1,n m−1,n m,n + m,n+1 m,n−1 m,n
α ∆t ∆x2 ∆y2
(1+ 4F )TP+1 − F (T P+1 +TP+1 +T P+1 +TP+1 ) = TP
O m,n O m+1,n m−1,n m,n+1 m,n−1 m,n
Stable
Aerospace and Mechanical Engineering Hankuk Aviation University
