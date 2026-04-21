# 3_Thermodynamic_Cycles

> 원본: `propulsion/3_Thermodynamic_Cycles.pdf` (1.8MB, 48 페이지 추출)

## 페이지 1
Thermodynamic Cycles
Section 3
1
고속 추진 및 연소 실험실

## 페이지 2
Thermodynamic Cycles
• Air-standard analysis is used to perform elementary analyses
of IC engine cycles.
• Simplifications to the real cycle include:
1) Fixed amount of air (ideal gas) for working fluid
2) Combustion process not considered
3) Intake and exhaust processes not considered
4) Engine friction and heat losses not considered
5) Specific heats independent of temperature
• The two types of reciprocating engine cycles analyzed are:
1) Spark ignition – Otto cycle
2) Compression ignition – Diesel cycle
2
고속 추진 및 연소 실험실

## 페이지 3
SI Engine Cycle vs Thermodynamic Otto Cycle
FUEL
A
I Ignition
R
Fuel/Air
Combustion
Mixture
Products
Actual
Cycle
Intake Compression Power Exhaust
Stroke Stroke Stroke Stroke
Q Q
in out
Air
Otto
TC
Cycle
BC
Compression Const volume Expansion Const volume
Process heat addition Process heat rejection
Process Process
3
고속 추진 및 연소 실험실

## 페이지 4
Actual SI Engine cycle
Ignition
TC BC
4
고속 추진 및 연소 실험실

## 페이지 5
Air-Standard Otto cycle
Process 1(cid:198) 2 Isentropic compression
Process 2 (cid:198) 3 Constant volume heat addition
Process 3 (cid:198) 4 Isentropic expansion
Process 4 (cid:198) 1 Constant volume heat rejection
Compression ratio:
v v
r = 1 = 4
v v
2 3
Q
in
Q
out
v v
2 1 TC BC
TC BC
5
고속 추진 및 연소 실험실

## 페이지 6
Real Cycle
50 3
열손실
P 3´
40
시간손실
(kg / cm 2)
배기 블로우다운손실
흡입 및 배기손실
30
c
연료·공기사이클
20
실제사이클
단열선
2
10
4
b a
d
1 V
< 연료-공기사이클과 실제사이클의 비교 >
6
고속 추진 및 연소 실험실

## 페이지 7
Real Cycle
7
고속 추진 및 연소 실험실

## 페이지 8
First Law Analysis of Otto Cycle (constant k)
1(cid:198)2 Isentropic Compression
AIR
Q W
in
(u −u ) = − (− )
2 1
m m
W
in = (u − u ) = c (T −T )
2 1 v 2 1
m
k−1 P T v
T ⎛ v ⎞
2 = 2 ⋅ 1
2 = ⎜ 1 ⎟ = rk−1
⎜ ⎟ P T v
T v
⎝ ⎠ 1 1 2
1 2
2(cid:198)3 Constant Volume Heat Addition
Q W
in
(u −u ) = (+ ) −
Q
3 2
m m AIR in
TC
Q
in = (u −u ) = c (T −T )
3 2 v 3 2
m
P T
3 = 3
P T
2 2
8
고속 추진 및 연소 실험실

## 페이지 9
3 (cid:198) 4 Isentropic Expansion
Q W
out
(u −u ) = − (+ )
4 3 AIR
m m
W
out = (u −u ) = c (T −T )
3 4 v 3 4
m
k−1
T ⎛ v ⎞ 1
P T v
4 = ⎜ 3 ⎟ = 4 = 4 ⋅ 3
⎜ ⎟
T v rk−1
⎝ ⎠ P T v
3 4
3 3 4
4 (cid:198) 1 Constant Volume Heat Removal
Q W
out
(u − u ) = (− ) −
1 4 Q
m m
AIR out
Q
out = (u −u ) = c (T −T )
BC
4 1 v 4 1
m
P P
4 = 1
T T
4 1
9
고속 추진 및 연소 실험실

## 페이지 10
First Law Analysis Parameters
Net cycle work:
( ) ( )
W =W −W = m u −u − m u −u
cycle out in 3 4 2 1
Cycle thermal efficiency:
W ( u −u ) − ( u −u ) ( u −u ) − ( u −u ) u −u
η = cycle = 3 4 2 1 = 3 2 4 1 =1− 4 1
th ( )
Q u −u u −u u −u
in 3 2 3 2 3 2
c (T −T ) T 1
=1− v 4 1 =1− 1 =1− p = ρRT
c (T −T ) T rk−1
v 3 2 2
u = C T
v
C = R /(γ−1)
Indicated mean effective pressure is:
v
W imep Q ⎛ r ⎞ 1 ⎛Q / m⎞⎛ r ⎞
imep = cycle → = in ⎜ ⎟η = ⎜ in ⎟⎜ ⎟η
⎜ ⎟
th th
V −V P PV ⎝ r −1⎠ k −1 ⎝ u ⎠⎝ r −1⎠
1 2 1 1 1 1
10
고속 추진 및 연소 실험실

## 페이지 11
Effect of Compression Ratio on Thermal Efficiency
1
η =1−
th rk−1
const c
V
Typical SI
engines
9 < r < 11
k = 1.4
• Spark ignition engine compression ratio limited by T (autoignition)
3
and P (material strength), both ~rk
3
• For r = 8 the efficiency is 56%
11
고속 추진 및 연소 실험실

## 페이지 12
Effect of Specific Heat Ratio on Thermal Efficiency
1
η =1−
th rk−1
const c
V
Specific heat
ratio (k)
Cylinder temperatures vary between 20K and 2000K so 1.2 < k < 1.4
k = 1.3 most representative
12
고속 추진 및 연소 실험실

## 페이지 13
Factors Affecting Work per Cycle
The net cycle work of an engine can be increased by either:
i) Increasing the r (1’(cid:198)2)
ii) Increase Q (2(cid:198)3”)
in
W Q ⎛ r ⎞
3’’ imep = cycle = in ⎜ ⎟η
th
P V −V V ⎝ r −1⎠
1 2 1
3 (ii)
4’’
Q
in 4
W
cycle
4’
2
(i)
1
1’
V V
2 1
13
고속 추진 및 연소 실험실

## 페이지 14
Effect of Compression Ratio on Thermal Efficiency and MEP
imep Q ⎛ r ⎞⎛ 1 ⎞
= in ⎜ ⎟⎜1− ⎟
P PV ⎝ r −1⎠⎝ rk ⎠
1 1 1
k = 1.3
14
고속 추진 및 연소 실험실

## 페이지 15
Thermodynamic Cycles for CI engines
• In early CI engines the fuel was injected when the piston reached TDC
and thus combustion lasted well into the expansion stroke.
• In modern engines the fuel is injected before TDC (about 15o)
Fuel injection starts
Fuel injection starts
Early CI engine Modern CI engine
• The combustion process in the early CI engines is best approximated by
a constant pressure heat addition process (cid:198) Diesel Cycle
• The combustion process in the modern CI engines is best approximated
by a combination of constant volume and constant pressure (cid:198) Dual Cycle
15
고속 추진 및 연소 실험실

## 페이지 16
Early CI Engine Cycle and the Thermodynamic Diesel Cycle
Fuel injected
A
at TC
I
R
Combustion
Air
Products
Actual
Cycle
Intake Compression Power Exhaust
Stroke Stroke Stroke Stroke
Q Q
in out
Air
Diesel
Cycle
BC
Compression Const pressure Expansion Const volume
Process heat addition Process heat rejection
Process Process
16
고속 추진 및 연소 실험실

## 페이지 17
Air-Standard Diesel cycle
Process 1(cid:198) 2 Isentropic compression
Process 2 (cid:198) 3 Constant pressure heat addition
Process 3 (cid:198) 4 Isentropic expansion
Process 4 (cid:198) 1 Constant volume heat rejection
Cut-off ratio:
Q
in v
3
r =
c
v
2
Q
out
v v
2 1 TC BC
TC BC
17
고속 추진 및 연소 실험실

## 페이지 18
First Law Analysis of Diesel Cycle
Equations for processes 1(cid:198)2, 4(cid:198)1 are the same as those presented
for the Otto cycle
2(cid:198)3 Constant Pressure Heat Addition
AIR Q
in
( )
Q P V −V
in 2 3 2
(u − u ) = (+ ) −
3 2
m m
Q
in
= (u + P v ) − (u + P v )
3 3 3 2 2 2
m
Q
in = (h − h ) = c (T −T )
3 2 p 3 2
m
RT RT T v
P = 2 = 3 → 3 = 3 = r
c
v v T v
2 3 2 2
18
고속 추진 및 연소 실험실

## 페이지 19
3 (cid:198) 4 Isentropic Expansion
Q W
out
(u −u ) = − (+ )
4 3
m m AIR
W
out = (u −u ) = c (T −T )
3 4 v 3 4
m
v v v v v r
4 = 4 ⋅ 2 = 1 ⋅ 2 =
note v =v so
4 1 v v v v v r
3 2 3 2 3 c
P v P v P T r
4 4 = 3 3 → 4 = 4 ⋅ c
T T P T r
4 3 3 3
k−1 k−1
T ⎛ v ⎞ ⎛ r ⎞
4 = ⎜ 3 ⎟ = ⎜ c ⎟
⎜ ⎟
T ⎝ v ⎠ ⎝ r ⎠
3 4
19
고속 추진 및 연소 실험실

## 페이지 20
Thermal Efficiency
Q m u −u
out 4 1
η =1− =1−
Diesel
Q m h − h
cycle in 3 2
For cold air-standard the above reduces to:
( )
1 ⎡1 r k −1 ⎤ 1
η Diesel =1− r k−1 ⎢ k ⋅ ( r c −1 )⎥ recall, η Otto =1− r k−1
const c ⎣ ⎦
c
V
Note the term in the square bracket is always larger than one so for the
same compression ratio, r, the Diesel cycle has a lower thermal efficiency
than the Otto cycle
Note: CI needs higher r compared to SI to ignite fuel
20
고속 추진 및 연소 실험실

## 페이지 21
Thermal Efficiency
Typical CI Engines
15 < r < 20
When r (= v /v )(cid:198)1 the Diesel cycle efficiency approaches the
c 3 2
efficiency of the Otto cycle
Higher efficiency is obtained by adding less heat per cycle, Q ,
in
(cid:198) run engine at higher speed to get the same power.
21
고속 추진 및 연소 실험실

## 페이지 22
The cut-off ratio is not a natural choice for the independent variable
a more suitable parameter is the heat input, the two are related by:
k −1⎛ Q ⎞ 1
r =1− ⎜ in ⎟ as Q (cid:198) 0, r (cid:198)1
c ⎜ ⎟ in c
k ⎝ PV ⎠ r k−1
1 1
k = 1.3
k = 1.3
22
고속 추진 및 연소 실험실

## 페이지 23
Modern CI Engine Cycle and the Thermodynamic Dual Cycle
Fuel injected
A at 15o bTC
I
R
Air Combustion
Products
Actual
Cycle
Intake Compression Power Exhaust
Stroke Stroke Stroke Stroke
Q Q Q
in in out
Air
Diesel
TC
Cycle
BC
Compression Const volume Const pressure Expansion Const volume
Process heat addition heat addition Process heat rejection
Process Process Process
23
고속 추진 및 연소 실험실

## 페이지 24
Dual Cycle
Process 1 (cid:198) 2 Isentropic compression
Process 2 (cid:198) 2.5 Constant volume heat addition
Process 2.5 (cid:198) 3 Constant pressure heat addition
Process 3 (cid:198) 4 Isentropic expansion
Process 4 (cid:198) 1 Constant volume heat rejection
Q
2.5 3 in
3
2 Q
in
2.5
4
2
4
1
1 Q
out
Q
in = (u − u ) + (h − h ) = c (T −T ) + c (T −T )
2.5 2 3 2.5 v 2.5 2 p 3 2.5
m
24
고속 추진 및 연소 실험실

## 페이지 25
Thermal Efficiency
Q m u −u
η =1− out =1− 4 1
Dual
Q m (u −u ) + (h − h )
cycle
in 2.5 2 3 2.5
1 ⎡ αrk −1 ⎤
η =1− c
⎢ ⎥
Dual rk−1 (α−1) +αk ( r −1 )
⎣ ⎦
const c
v c
v P
where r = 3 and α= 3
c v P
2.5 2
Note, the Otto cycle (r =1) and the Diesel cycle (α=1) are special cases:
c
( )
1 1 ⎡1 r k −1 ⎤
c
η =1− η =1− ⎢ ⋅ ( )⎥
Otto r k−1 c D o i n e s s t e l c r k−1 ⎣ k r −1 ⎦
c
V
25
고속 추진 및 연소 실험실

## 페이지 26
The use of the Dual cycle requires information about either:
i) the fractions of constant volume and constant pressure heat addition
(common assumption is to equally split the heat addition), or
ii) maximum pressure P .
3
Transformation of r and αinto more natural variables yields
c
k −1⎡⎛ Q ⎞ 1 α−1⎤
1 P
in
r =1− ⎜ ⎟ − 3
c ⎢⎜ ⎟ ⎥ α=
αk ⎣⎝ P 1 V 1 ⎠ r k−1 k −1 ⎦ r k P
1
For the same initial conditions P , V and the same compression ratio:
1 1
η >η >η
Otto Dual Diesel
For the same initial conditions P , V and the same peak pressure P
1 1 3
(actual design limitation in engines):
η >η >η
Diesel Dual otto
26
고속 추진 및 연소 실험실

## 페이지 27
27
고속 추진 및 연소 실험실

## 페이지 28
For the same initial conditions P , V For the same initial conditions P , V
1 1 1 1
and the same compression ratio P /P : and the same peak pressure P :
2 1 3
P
max
“x” →“2.5”
Q
out P
η =1− o
th
Q
in
P
o
1
Tds
∫
4
=1−
3
Tds
∫
2 T
max
o
Ott
al
u
D
Diesel Diesel
al
u
D
o
Ott
28
고속 추진 및 연소 실험실
T
,erutarepmeT
P
,erusserP
T
,erutarepmeT
P
,erusserP
Specific Volume
Specific Volume
Entropy Entropy

## 페이지 29
29
고속 추진 및 연소 실험실

## 페이지 30
Cycle Exhaust Process
In the Otto and Diesel cycles the exhaust process is modeled as
constant volume heat extraction, it does not consider the actual
gas flow.
P P
i e
Products
Actual exhaust
Q
out
Otto exhaust process 4-1 Air
BC
30
고속 추진 및 연소 실험실

## 페이지 31
Ideal Four-Stroke Cycle Intake and Exhaust
The intake & exhaust processes are
often shown as a constant pressure
processes, e.g., 5(cid:198)6 and 6(cid:198)1
For WOT states 1 and 5 are the same.
Process 5-6 indicates a decrease in
specific volume which is incorrect since
as the cylinder volume decreases so does
the mass (cid:198)specific volume remains the
same!
This inconsistency results from treating
an open system problem with a closed
system model
31
고속 추진 및 연소 실험실
P
,erusserP
WOT
EV closes
IV opens
IV closes
EV opens
Specific volume, v

## 페이지 32
Ideal Intake and Exhaust Strokes
Valves operate instantaneously, intake and exhaust process are adiabatic
and constant pressure.
Unthrottled: P = P = 1 atm
i e
EV opens
IV closes (state1)
EV closes
IV opens
Throttled: P < P
i e EV opens
EV closes
IV closes
6’
IV opens
Supercharged: P > P
i e
IV opens
6’
1
EV closes
32
고속 추진 및 연소 실험실

## 페이지 33
Actual Exhaust Stroke (4 (cid:198) 6)
The actual exhaust process consists of two phases:
i) Blowdown ii) Displacement
P
P T e
i i
Products
State 4 (BDC) State 5 (BDC) State 6 (TDC)
Blowdown Displacement
Blowdown – At the end of the power stroke when the exhaust valve opens
the cylinder pressure is much higher than the exhaust manifold pressure
which is typically at 1 atm (P > P ), so the cylinder gas flows out through the
4 e
exhaust valve and the pressure drops to P .
e
Displacement – Remaining gas is pushed out of the cylinder by the piston
moving to TC.
33
고속 추진 및 연소 실험실

## 페이지 34
Exhaust Blowdown
• During blowdown the gas remaining in the cylinder undergoes expansion
which can be modelled as isentropic (neglecting heat transfer)
Blowdown
Displacement
5
5 (Otto/Diesel)
TC BC
• State 5 at the end of blowdown is a fictitious state corresponding to no
actual piston location
P = P
5 e
k−1 k−1
⎛ P ⎞ k ⎛ P ⎞ k
T = T ⎜ 5 ⎟ = T ⎜ e ⎟
⎜ ⎟ ⎜ ⎟
5 4 4
P P
⎝ ⎠ ⎝ ⎠
4 4
34
고속 추진 및 연소 실험실

## 페이지 35
Residual Gas
The gas remaining in the clearance volume when the piston reaches TDC (pt 6)
called the residual gas mixes with intake gas (fuel-air for SI and air for CI)
The residual gas temperature T is equal to T
6 5
The Residual gas fraction f is defined as the ratio of the mass of residual
gas to the mass of the fuel-air (assume ideal gas Pv = RT)
m m V v 1 v 1T P 1T P
6 6 6 6 4 4 6 4 6
f = = = = = =
m m V v r v r T P r T P
1 4 4 4 6 6 4 5 4
k−1 k−1
T ⎛ P ⎞ k ⎛ P ⎞ k
since 5 = ⎜ 5 ⎟ = ⎜ 6 ⎟
⎜ ⎟ ⎜ ⎟
T P P
⎝ ⎠ ⎝ ⎠
4 4 4
1 1
1⎛ P ⎞k 1⎛ P ⎞k
5 e
f = ⎜ ⎟ = ⎜ ⎟
⎜ ⎟ ⎜ ⎟
r P r P
⎝ ⎠ ⎝ ⎠
4 4
Typically values of f are in the range 3% to 12%, lower in Diesels (larger r)
35
고속 추진 및 연소 실험실

## 페이지 36
Exhaust Manifold Gas Temperature (T )
7
The gas leaving the cylinder during blowdown has kinetic energy which is
converted into thermal energy when the exhaust gas comes to rest in the
exhaust gas manifold (cid:198) gas temperature in the exhaust manifold is
higher than T .
5
5
Fluid leaving the cylinder earliest has higher velocity so temperature higher
when it stagnates in the manifold (T > T > T ).
7a 7b 7c
36
고속 추진 및 연소 실험실

## 페이지 37
Intake Stroke 6(cid:198) 1
When the intake valve opens the fresh gas with mass m mixes with the
i
hotter residual gas with mass m so the gas temperature at the end of the
R
intake stroke T will be greater than the inlet temperature T .
1 i
Applying conservation of mass:
T
i
m = m − m = m − m
i 1 R 1 6
Applying conservation of energy (open system):
U −U = Q −W + m h
1 6 6−1 6−1 i i
m u − m u = −P(V −V ) + m h
1 1 6 6 i 1 6 i i
( ) ( ) ( )
m h − Pv − m h − P v = −P(V −V ) + m − m h
1 1 1 1 6 6 6 6 i 1 6 1 6 i
m ⎡ ⎛ m ⎞ ⎤
h = 6 h + ⎜ 1 −1⎟h + ( P − P ) v
⎢ ⎜ ⎟ ⎥
1 6 i 1 6 6
m m
⎣ ⎝ ⎠ ⎦
1 6
37
고속 추진 및 연소 실험실

## 페이지 38
Intake Gas Temperature (T )
1
Recall m = m f and assuming ideal gas P v = RT and h = c T
6 1 6 6 6 p
⎛ P ⎞
h = ( 1− f ) h + fh −⎜1− 1 ⎟ fRT
⎜ ⎟
1 i 6 6
P
⎝ ⎠
6
⎡ ⎛ P ⎞⎛ k −1⎞ ⎤
T = ( 1− f ) T + fT ⎢ 1− ⎜ ⎜1− 1 ⎟ ⎟⎜ ⎟⎥
1 i 6
⎣ ⎝ P ⎠⎝ k ⎠ ⎦
6
In terms of inlet and exhaust conditions P = P , P = P , T = T
1 i 6 e 6 e
⎡ ⎛ P ⎞⎛ k −1⎞ ⎤
T = ( 1− f ) T + fT ⎢ 1− ⎜ ⎜1− i ⎟ ⎟⎜ ⎟⎥
1 i e
⎣ ⎝ P ⎠⎝ k ⎠ ⎦
e
38
고속 추진 및 연소 실험실

## 페이지 39
m P / P −1
η = i =1− i e
Volumetric efficiency
v
ρV k(r −1)
i d
3
Pumping work
W = (P − P )V
5−6−1 i e d
Pumping mep pmep = P − P
e i
2
W −W
4
Recall: imep = 3−4 1−2
V 6
d e 5
i
1
6’
Net pmep ( imep ) = imep − pmep
net
Q = m q = (m -m ) q = m (1-f) q
Heat input 2(cid:198)3
in i in 1 6 in 1 in
Note: q is the heat added per kg of inducted gas
in
39
고속 추진 및 연소 실험실

## 페이지 40
Otto Cycle Analysis with Intake and Exhaust
The equations on the following slide are solved iteratively for the
following initial conditions:
T inlet fuel-air mixture temperature
i
P exhaust pressure
e
r compression ratio
P inlet pressure
i
k specific heat ratio
q heat added per unit mass of gas inducted
in
In the following equations T depends on the residual gas fraction f and
1
and temperature T . These values are assumed to start the calculation
e
and then improved over the subsequent iterations.
40
고속 추진 및 연소 실험실

## 페이지 41
Otto Cycle Analysis with Intake and Exhaust
⎡ ⎛ P ⎞⎛k −1⎞ ⎤
e,i -1: Intake stroke T 1 = ( 1− f ) T i + fT e ⎢ 1− ⎜ ⎜1− i ⎟ ⎟⎜ ⎟⎥
⎣ ⎝ P e ⎠⎝ k ⎠ ⎦
P = P
1 i
1 - 2: Isentropic compression stroke P = Pr k 3
2 1
k−1
T =T r
2 1
2 - 3: Constant volume heat addition T =T + q (1− f )/c
3 2 in V
P = P (T /T )
3 2 3 2
2
k−1
T =T (1/r)
3 - 4: Isentropic expansion stroke 4 3 4
k
P = P (1/r) 6
4 3 e 5
i
1
6’
(k−1)/k
T =T (P /P )
4 - 5: Isentropic blowdown
5 4 e 4
P = P
5 e
T =T
5 - e: Constant pressure adiabatic
e 5
1/k
f =1/r(P /P )
exhaust stroke P = P e 4
41 e 5
고속 추진 및 연소 실험실

## 페이지 42
Computer Program for Cycle Calculations
The Ferguson textbook has a companion web site at:
http://he-cda.wiley.com/WileyCDA/HigherEdTitle.rdr?productCd=0471356174
that has a useful program that does the calculation for you:
Four Stroke Gas Otto Cycle Applet
42
고속 추진 및 연소 실험실

## 페이지 43
Finite Heat Release Model
• In the Otto cycle it is assumed that heat is released instantaneously.
A finite heat release model specifies heat release as a function of crank
angle.
• The cumulative heat release or burn fraction x is given by:
b
⎡ n⎤
⎛θ−θ ⎞
x (θ) =1− exp⎢− a⎜ s ⎟ ⎥ 0 < x < 1
⎜ ⎟
b θ b
⎢ ⎝ ⎠ ⎥
⎣ d ⎦
where θ= crank angle
θ = start of heat release
s
θ = duration of heat release
d
n = form factor
Used to fit to experimental data
a = efficiency factor
43
고속 추진 및 연소 실험실

## 페이지 44
Finite Heat Release
A typical heat release curve consists of an initial spark ignition phase,
followed by a rapid burning phase and ends with burning completion phase
.99
dQ = Q dx
in b
The curve asymptotically approaches 1 so the end of combustion is defined
by an arbitrary limit, such as 90% or 99% complete combustion where
x a
= 0.90 or 0.99 corresponding values for efficiency factor are 2.3 and 4.6
b
The rate of heat release as a function of crank angle is:
⎧ n−1⎫
dQ dx ⎪na ⎛θ−θ ⎞ ⎪
= Q b = Q ( 1− x ) ⎜ s ⎟
⎨ ⎬
⎜ ⎟
in in b
dθ dθ θ θ
⎪ ⎝ ⎠ ⎪
⎩ d d ⎭
44
고속 추진 및 연소 실험실

## 페이지 45
Finite Heat Release Model
Applying First Law to the closed system containing the gas in the cylinder
for a small crank angle change,dθ,
dU =δQ −δW
⎛ PV ⎞
assuming ideal gas dU = mc dT = mc d⎜ ⎟
v v
⎝ mR ⎠
c
δQ − PdV = v ( PdV +VdP )
R
per unit crank angle
dQ dV c ⎛ dV dP ⎞
− P = v ⎜ P +V ⎟
dθ dθ R ⎝ dθ dθ⎠
dP P dV k −1⎛ dQ ⎞
= −k + ⎜ ⎟
45 dθ V dθ V ⎝ dθ⎠
고속 추진 및 연소 실험실

## 페이지 46
Finite Heat Release Model
The cylinder volume in terms of crank angle, V(θ), is
V V ( )
d d 2 2 1 2
V (θ) = + R +1− cosθ− (R −sin θ)
r −1 2
Differentiating wrt θ
dV V ( )
d 2 2 −1 2
= sinθ1+ cosθ(R −sin θ)
dθ 2
π
where V = B2S = displacement volume
d
4
r = compression ratio
2l
R =
s
For the portion of the compression and expansion strokes with no heat
release, where θ< θ and θ> θ + θ (cid:198) dQ/dθ= 0
s s d
46
고속 추진 및 연소 실험실

## 페이지 47
Finite Heat Release Model Results
Start of heat release:
Engine 1 - 20o bTC
Engine 2 - TC
Duration 40o
47
고속 추진 및 연소 실험실

## 페이지 48
Finite Heat Release Model Results
48
고속 추진 및 연소 실험실
