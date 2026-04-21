# Chapter4(PP)

> 원본: `heat-transfer/Chapter4(PP).pdf` (0.6MB, 21 페이지 추출)

## 페이지 1
Micro&Nano
Heat Transfer
LLabooragtoroy
CChhaapptteerr 44 TTwwoo--DDiimmeennssiioonnaall
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
1. Treatment for Diffusion under Two-Dimensional,
Steady-State Conditions
2. Finite-Difference Equation
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 3
4.1 Alternative Approaches Micro&Nano
Heat Transfer
LLabooragtoroy
Analytical (cid:206) Exact Solutions (Separation of Variables)
Graphical (cid:206) Approximate Results at Discrete Points
Numerical (cid:206) Finite Difference Method (FDM), Finite Volume Method (FVM)
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 4
4.2 The Method of SepartionovVariables Micro&Nano
Heat Transfer
LLabooragtoroy
Governing Equation
∂2T ∂2T
+ = 0
∂x2 ∂y2
T −T ∂2θ ∂2θ
Let θ= 1 + = 0
T −T ∂x2 ∂y2
2 1
B.C. θ(0, y) = 0 θ(L, y) = 0 θ(x,0) = 0 θ(W,0) =1
Let θ(x, y) = X (x)Y(y)
1 d2X 1 d2Y
= − = −λ2
X dx2 Y dy2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 5
4.2 The Method of SepartionovVariables Micro&Nano
Heat Transfer
LLabooragtoroy
Two ODEs
d2X
+λ2X = 0 X = C cosλx + C sinλx
dx2 1 2
d2Y
−λ2Y = 0 Y = C e−λ y + C eλ y
dx2 3 4
B.C. θ(0, y) = 0 C = 0
1
θ(L, y) = 0 0 = C sinλL λL = nπ
2
nπ
λ= where n =1,2,3,....
L
nπ ( )
θ= XY = C sin x C e−λ y + C eλ y
2 3 4
L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 6
4.2 The Method of Separation of Variables Micro&Nano
Heat Transfer
LLabooragtoroy
B.C. θ(x,0) = 0 C + C = 0
3 4
nπ ⎛ nπ nπ ⎞
y − y
θ= XY = C C sin x⎜e L − e L ⎟
2 4 ⎜ ⎟
L
⎝ ⎠
⎛ nπ nπ ⎞
y − y
nπ ⎜ e L −e L ⎟ nπ nπ
θ = XY = C sin x = C sin xsinh y
⎜ ⎟
n n n
L 2 L L
⎜ ⎟
⎝ ⎠
∞ nπ nπ ∞ nπ nπ
θ(x,W) =1= ∑C sin xsinh W = ∑C sinh W sin x
n n
L L L L
n=1 n=1
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 7
4.2 The Method of Separation of Variables Micro&Nano
Heat Transfer
LLabooragtoroy
Orthogonal functions
An infinite set of functions g (x), g (x), …, g (x) … is said to be orthogonal
1 2 n
in the domain a ≤ x ≤ b if
b
∫ g (x)g (x)dx = 0 m ≠ n
m n
a
Ex ∞
∑
f (x) = A g (x)
n n
n=1
Using the orthogonality of g(x)
∞
b b
∫ f (x)g (x)dx = ∫ g (x) ∑ A g (x)dx
m m n n
a a
n=1
b b
∫ f (x)g (x)dx = A ∫ g2 (x)dx
m m m
a a
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 8
4.2 The Method of Separation of Variables Micro&Nano
Heat Transfer
LLabooragtoroy
b
∫ f (x)g (x)dx
b b
∫ f (x)g (x)dx = A ∫ g2 (x)dx A = a n
m m m
a a n b
∫ g2(x)dx
n
a
∞ nπ nπ ∞ nπ
1= ∑C sinh W sin x = ∑ A sin x
n n
L L L
n=1 n=1
nπx
L
∫ sin dx 2 (−1)n+1 +1
2 (−1)n+1 +1
0 L C =
A = = n
π ⎛ nπW ⎞
n nπx
L π n n⎜sinh ⎟
∫ sin2 dx
⎝ L ⎠
0 L
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 9
4.2 The Method of Separation of Variables Micro&Nano
Heat Transfer
LLabooragtoroy
ambient
100oC 100oC
200oC
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 10
4.3 The Graphical Method Micro&Nano
Heat Transfer
LLabooragtoroy
The rational for the graphical method comes from the fact
that lines of constant temperature must be perpendicular to lines
that indicate the direction of heat flow
ab + cd
∆x ≈
2
ac + bd
∆y ≈
2
M
∑
q = q = Mq
Total
i i
i
where M is number of lanes
∆T ∆T
j j
q ≈ kA = k(∆y ⋅l)
i i
∆x ∆x
where l is the length of the channel normal to the page
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 11
4.3 The Graphical Method Micro&Nano
Heat Transfer
LLabooragtoroy
N ∆T
∆T = ∑ T = N∆T ∆T = 1−2
1−2 j j j N
j=1
M ∆y M
q = Mq = lk ∆T If ∆x=∆y q = Mq = lk∆T = Sk∆T
i 1−2 i 1−2 1−2
N ∆x N
where S is shape factor
1
R =
t,cond(2D)
Sk
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 12
4.3 The Graphical Method Micro&Nano
Heat Transfer
LLabooragtoroy
Some points to note when using Table 4.1
• q = 0(No Internal Heat Generation)
&
• k=const.
• Two surface should be isothermal
• Special care should be taken with the configuration involving
an infinite medium
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 13
4.4 Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
4.4.1 The Nodal Network
Nodal Point ~ Node
A numerical solution enables
determination of the temperature
at only discrete points
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 14
4.4 Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
4.4.2 The Finite-Difference Form of the Heat Equation
∂T ∂T
−
∂2T ∂x ∂x T +T − 2T
≈ m+1/2,n m−1/2,n = m+1,n m−1,n m.n
∂x2 ∆x ( ∆x )2
∂T ∂T
−
∂2T ∂y ∂y T +T − 2T
≈ m,n+1/2 m,n−1/2 = m,n+1 m,n−1 m.n
∂y2 ∆y ( ∆y )2
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 15
4.4 Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
2D Conduction Equation at Steady State
∂2T ∂2T
T + T + T + T − 4T = 0
+ = 0
m,n+1 m,n−1 m+1,n m−1,n m.n
∂x2 ∂y2
where ∆x = ∆y
Exact differential equation is reduced to an appropriate algebraic equation
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 16
4.4 Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
4.4.3 The Energy Balance Method
Appling conservation of energy to a control volume about the nodal region
4
∑ ( )
q + q ∆x∆y1 = 0
E& + E& = 0 &
i→(m,n)
g in
i=1
T −T
q = k(∆y1) m−1,n m,n
(m−1,n)→(m,n)
∆x
T −T
q = k(∆y1) m+1,n m,n
(m+1,n)→(m,n)
∆x
T −T
q = k(∆x1) m,n+1 m,n
(m,n+1)→(m,n)
∆y
T −T
q = k(∆x1) m,n−1 m,n
(m,n−1)→(m,n)
∆y
q∆x∆y
&
T + T + T + T + − 4T = 0 where ∆x = ∆y
m,n+1 m,n−1 m+1,n m−1,n m,n
k
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 17
4.4 Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
∑ ∑
q + q = 0 (No heat generation)
cond conv
Conduction
T −T T −T
q = k(∆y1) m−1,n m,n q = k(∆x1) m,n+1 m,n
(m−1,n)→(m,n) ∆x (m,n+1)→(m,n) ∆y
∆y T −T ∆x T −T
q = k( 1) m+1,n m,n q = k( 1) m,n−1 m,n
(m+1,n)→(m,n) 2 ∆x (m,n−1)→(m,n) 2 ∆y
Convection
⎛ ∆x ⎞ ⎛ ∆y ⎞
q = h⎜ 1⎟(T −T ) + h⎜ 1⎟(T −T )
∞→(m,n) ∞ m,n ∞ m,n
⎝ 2 ⎠ ⎝ 2 ⎠
1 ( ) h∆x ⎛ h∆x ⎞
T +T + T +T + T + ⎜3 + ⎟T = 0 where ∆x = ∆y
m−1,n m,n+1 m,n−1 m+1,n ∞ m,n
2 k ⎝ k ⎠
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 18
4.5 Solving the Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Solving a system of linear algebraic equation
1) Matrix Inversion Method
2) Gauss-Seidel Method
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 19
4.5 Solving the Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Matrix Inversion Method
a T + a T + a T + .......+ a T = C
11 1 12 2 13 3 1N N 1
[ ][ ] [ ]
A T = C
a T + a T + a T + .......+ a T = C
21 1 22 2 23 3 2N N 2
a T + a T + a T +.......+ a T = C
N1 1 N2 2 N3 3 NN N N
[ ] [ ]−1[ ]
Solution T = A C
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 20
4.5 Solving the Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
Gauss-Seidel Iteration
1) Rearrange equations ==> Diagonally Dominant
a > a , a ... a > a , a ...
11 12 13 22 21 23
2) Assume initial values for T (k=0)
3) Temperature associated with the diagonal elements
C i−1 a N a
T(k) = i − ∑ ij T(k) − ∑ ij T(k−1)
i j j
a a a
ii j=1 ii j=i+1 ii
a T + a T + a T + .......+ a T = C
11 1 12 2 13 3 1N N 1
a T + a T + a T + .......+ a T = C
21 1 22 2 23 3 2N N 2
4) Continue iteration
T(k) −T(k−1) <ε
i i
Aerospace and Mechanical Engineering Hankuk Aviation University

## 페이지 21
4.5 Solving the Finite-Difference Equations Micro&Nano
Heat Transfer
LLabooragtoroy
T = 20oC
# HW ∞
h =10W /m2K
k = 237W /mK
Insulation
Insulation
10cm
T = 300oC
1
10cm
Aerospace and Mechanical Engineering Hankuk Aviation University
