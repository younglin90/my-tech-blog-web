# chap_7_numhyd_riemann_2

> 원본: `numerical-analysis/chap_7_numhyd_riemann_2.pdf` (0.1MB, 13 페이지 추출)

## 페이지 1
Chapter 7
Riemann solvers II
7.1 Roe’s linearized Riemann solver
7.1.1 The equations ofhydrodynamics revisited
Before we constructourlinearized Riemann solver,let us makeaslightlymodified definitionof
the state vector q, which allows us an easy generalization of our algorithmsto 3-D. We define q
tobe
ρe
tot
 ρu 
q = ρv (7.1)
 
 ρw 
 
 ρ 
 
Forconvenienceweshallindexitfrom 0 to4:
q = ρe q = ρu q = ρv q = ρw q = ρ (7.2)
0 tot 1 2 3 4
Thefullset ofequationsfor3-D hydrodynamicsisthen:
∂ q +∂ f (q)+∂ f (q)+∂ f (q) = 0 (7.3)
t x x y y z z
where
ρh u ρh v ρh w
tot tot tot
ρu2 +P  ρuv   ρuw 
f = ρvu f = ρv2 +P f = ρvw (7.4)
x y z
     
 ρwu   ρwv  ρw2 +P
     
 ρu   ρv   ρw 
     
7.1.2 Linearized Riemann solvers
We haveseen thatfor linearproblemstheRiemann solverreduces to a characteristicsolver. For
the full non-linear set of equations of hydrodynamics this is no longer the case. A Riemann
solver, such as Godunov’s method, is then a rather complex solver because it involves complex
and non-linearsolutionstotheRiemann problemat each cell interface. It isalso rathercostly to
solvenumerically. CheaperandelegantsimplificationsarelinearizedRiemannsolvers. Theway
this is done is by expressing our interface fluxes as much as possible only using the differences
inthestatevariables:
∆q q q (7.5)
k,i−1/2 k,i−1/2,R k,i−1/2,L
≡ −
Ifthesedifferencesaresmall,thenmuchofthealgebracanbelinearizedtofirstorderin∆q .
k,i−1/2
109

## 페이지 2
110
Ifwenowsetthestateatthebeginningofeach timestepconstantwithineach cell,thenthe
cell interfaces havejumpsofthestate, i.e. theydefine a Riemann problem. Theway to linearize
this is to define an average state at the interface qˆ (note: here we retain the index k of the
k,i−1/2
indexnotation)in someway:
qˆ = Average[q ,q ] (7.6)
k,i−1/2 k,i k,i−1
where the precise definition of the average will be defined later. For now we can simply set
qˆ = (q + q )/2 for instance. Now we can express the Riemann problem in the
k,i−1/2 k,i k,i−1
deviationfrom thisaverage:
δq q qˆ (7.7)
k,i−1/2,L k,i−1 k,i−1/2
≡ −
δq q qˆ (7.8)
k,i−1/2,R k,i k,i−1/2
≡ −
If δq qˆ then, locally, the Riemann problem can be regarded as a linear
k,i−1/2,L/R k,i−1/2
| | ≪ | |
Riemannproblem,whichwehaveextensivelydiscussedinSection6.5. Theadvectionmatrixin
x direction is now simplytheJacobian ∂f (q)/∂q, so the equation, locallybetween x < x <
x i−1
x becomes:
i
∂f
∂ δq+ x ∂ δq = 0 (7.9)
t x
(cid:18) ∂q (cid:19)
The eigenvalues of the Jacobian ∂f /∂q at the interface i 1/2 are (for convenience we
x
−
leaveoutthei 1/2index):
−
λ = uˆ C ˆ (7.10)
1 s
−
λ = uˆ+Cˆ (7.11)
2 s
λ = uˆ (7.12)
3
λ = uˆ (7.13)
4
λ = uˆ (7.14)
5
witheigenvectors:
h ˆ Cˆ uˆ h ˆ +Cˆ uˆ
tot s tot s
−
 uˆ Cˆ   uˆ+Cˆ 
s s
−
e = vˆ e = vˆ (7.15)
1 2
   
 wˆ   wˆ 
   
 1   1 
   
1uˆ2 vˆ2 wˆ2
2
 uˆ  0  0 
e = vˆ e = 1 e = 0 (7.16)
3 4 5
     
 wˆ  0  1 
     
 1  0  0 
     
where h ˆ = eˆ +Pˆ/ρˆis the total specific enthalpy and Cˆ = γPˆ/ρˆis the adiabatic sound
tot tot s
q
speed. In all symbols the caretˆindicates that these are the primitive variables as derived from
the “average state” qˆ at the location of interface i 1/2. Note that we can derive similar
i−1/2
−
expressionsfortheadvectioniny and z direction.

## 페이지 3
111
We can now directly insert those formulae to Eq. (6.56) and apply this to the values of
δq . Now the special form of Eq.(6.56) comes to our advantage, because since this
k,i−1/2,L/R
expression(andtheexpressionsforthefluxlimiters)onlydependonthedifferenceδq
k,i−1/2,R
−
δq q q ∆q ,wecannowforgetaboutδq andfocus
k,i−1/2,L k,i−1/2,R k,i−1/2,L k,i−1/2 k,i−1/2,L/R
≡ − ≡
entirely on ∆q , which is the jump of the state over the interface. We can now decompose
k,i−1/2
∆q intotheeigenvectorsEq.(7.15...7.16):
k,i−1/2
∆q = ∆ ˜ q e (7.17)
k,i−1/2 m,i−1/2 m,k,i−1/2
mX=1···5
where(again forclarityweomittheindexi 1/2):
−
γ 1 ∆q uˆ∆q
∆ ˜ q = − eˆ ∆q ξ 1 − 4 (7.18)
1 2Cˆ2 { kin 4 − }− 2Cˆ
s s
γ 1 ∆q uˆ∆q
∆˜q = − eˆ ∆q ξ + 1 − 4 (7.19)
2 2Cˆ2 { kin 4 − } 2Cˆ
s s
γ 1
∆˜q = − (h ˆ 2eˆ )∆q +ξ (7.20)
3 2C ˆ2 n tot − kin 4 o
s
∆˜q = ∆q v∆q (7.21)
4 2 4
−
∆˜q = ∆q w∆q (7.22)
5 3 4
−
where eˆ = (uˆ2 +vˆ2 +wˆ2)/2 and ξ u∆q +v∆q +w∆q ∆q . With these expressions
kin 1 2 3 0
for∆˜q theflux at theinterface bec ≡ omes(cf. Eq.6.56)becom − es
i−1/2
f n+1/2 =1(fn +fn )
k,i−1/2 2 k,i−1/2,R k,i−1/2,L
(7.23)
1 λ ∆ ˜ q [θ +φ ˜ (ǫ θ )]
− 2 m,i−1/2 k,i−1/2 m,i−1/2 m,i−1/2 m,i−1/2 − m,i−1/2
mX=1···5
whereweretainedtheindexk intheexpressionfortheflux: f n+1/2 accordingtoindexnotation.
k,i−1/2
We now see that the interface flux for this linearized Riemann solver consists of the average of
thenon-linearfluxes plus acorrection term in which thedifference oftheflux overthe interface
isdecomposedintoeigenvectorsand each componentadvectedin itsownupwindfashion.
A linearized Riemann solver is evidently not an exact Riemann solver, since the Riemann
problem is solved in an approximate way only. This is why linearized Riemann solvers are part
ofthe(larger)familyofapproximanteRiemannsolvers.
7.1.3 Roe’s averageinterface state
Thefinalmissingpieceofthealgorithmisasuitableexpressionforthe“averageinterfacestate”,
or better, the “average interface primitivevariables” uˆ , vˆ , wˆ , ρˆ , h ˆ . As
i−1/2 i−1/2 i−1/2 i−1/2 tot,i−1/2
long as the numerical solution is very smooth, i.e. that ∆q qˆ , then any rea-
k,i−1/2 k,i−1/2
| | ≪ | |
sonable average would do and would probably give the right results. However, when contact
discontinuitiesand/orshockwavesarepresentinthesolution,thenitbecomesextremelyimpor-
tantto definetheproperaveragesuch that the“linearization”(whichis thenstrictlyspeakingno
longervalid)stillproducestherightpropagationofthesediscontinuities.
A Roe solver is a linearized Riemann solver with a special kind of averaged state at the

## 페이지 4
112
interface. Thesestatevariablesaredefined as:
√ρ u +√ρ u
L L R R
uˆ = (7.24)
√ρ +√ρ
L R
√ρ v +√ρ v
L L R R
vˆ = (7.25)
√ρ +√ρ
L R
√ρ w +√ρ w
L L R R
wˆ = (7.26)
√ρ +√ρ
L R
√ρ h +√ρ h
h ˆ = L tot,L R tot,R (7.27)
tot
√ρ +√ρ
L R
With theseexpressionsfor theaverage interfacestateand theabovedefined eigenvectordecom-
positionand interfaceflux expressions,as well as theflux limiter,theRoe solveriscomplete.
7.1.4 Background ofRoe’s averageinterface state
So where do these expressions for the interface state come from? Here we follow the book
by LeVeque. The basic idea behind the Roe solver is that it should recognize when a jump of
the state q q is a pure jump in one characteristic family only, and in that case produce the
R L
−
exact propagation velocity. So for a shock or for a contact discontinuity belonging to just one
characteristic family the interface-average propagation matrix Aˆ (which is the interface average
oftheJacobian∂f /∂q) shouldhavetheproperty:
x
A ˆ (q q ) = f f = s(q q ) (7.28)
R L x,R x,L R L
− − −
where s is the propagation speed of this wave. Note that this should not only hold for small
q q , but also when thejump is macroscopic. In case ofa contact discontinuityit shouldget
R L
−
s = u andfora shockwaveitshouldobtains = v where v istheshockvelocity.
s s
There isan elegantmathematicalderivationofhowweobtain Roe’s parameterizationfrom
theabovecondition,whichisbased on thedefinitionofastatevectorW defined as:
h
tot
 u 
W = √ρ v (7.29)
 
 w 
 
 1 
 
also counted from 0 to 4. The nice property of this parameter vector is that the state vector is
perfectly quadraticinthecomponentsofW:
1W W + γ−1(W2 +W2 +W2)
γ 0 4 2γ 1 2 3
 W W 
1 4
q = W W (7.30)
 2 4 
 W W 
 3 4 
 W2 
 4 
and sois theflux f :
x
W W
0 1
 γ− γ 1W 0 W 4 + γ 2 + γ 1W 1 2 − γ 2 − γ 1(W 2 2 +W 3 2)
f = W W (7.31)
x  1 2 
 W W 
 1 3 
 W W 
 1 4 

## 페이지 5
113
and similar for f and f . This purely quadratic relation is very useful for the following argu-
y z
mentation.
Iftwostatesq andq areconnectedbyasinglewave(shockorcontactdiscontinuity),then
R L
theyobey
f (q ) f (q ) = s(q q ) (7.32)
x R x L R L
− −
where s is the propagation speed of this wave. We wish that our matrix A ˆ (our “Jacobian”)
recognizes this. So itshouldhavethepropertythat
Aˆ(q q ) = s(q q ) (7.33)
R L R L
− −
orinotherwords:
Aˆ(q q ) = f (q ) f (q ) (7.34)
R L x R x L
− −
One way to obtain such a matrix is to integrate the Jacobian matrix A(q) over a suitablepath in
parameterspacefrom q to q . We can dothisforinstancebydefining astraightpath:
L R
q(ξ) = q +(q q )ξ (7.35)
L R L
−
sothat weget
1 ∂f (q(ξ))
x
f (q ) f (q ) = dξ
x R x L
− Z ∂ξ
0
1 ∂f (q(ξ))∂q(ξ)
= x dξ (7.36)
Z ∂q dξ
0
1 ∂f (q)
x
= dξ (q q )
R L
(cid:20)Z ∂q (cid:21) −
0
whereweused ∂q(ξ)/∂ξ = (q q ). ThisthegivesusthematrixA ˆ:
R L
−
1 ∂f (q)
Aˆ = x dξ (7.37)
Z ∂q
0
The problem with this integral is that it is not guaranteed that this produces a matrix which has
real eigenvalues. Moreover,itishard to evaluate,and therefore computationallycostly.
NowheretheparametervectorW comesin. Letusdothesametrickofintegration,butthis
timenotin q space butinW space:
W(ξ) = W +(W W )ξ (7.38)
L R L
−
sothat weget
1 ∂f (W)
x
f (q ) f (q ) = dξ (W W )
x R x L R L
− (cid:20)Z ∂W (cid:21) − (7.39)
0
ˆ
C(W W )
R L
≡ −
Wecan do thesameforq q :
R L
−
1 ∂q(W)
q q = dξ (W W )
R L R L
− (cid:20)Z ∂W (cid:21) − (7.40)
0
Bˆ(W W )
R L
≡ −

## 페이지 6
114
So wehavenowtwomatricesB and C. Wecan nowconstruct thematrixAˆ:
Aˆ = CˆBˆ−1 (7.41)
Now the nice thing of the parameter vector W is that both q and f are purely quadratic in W,
x
and therefore the ∂q/∂W and ∂f /∂W are linear in W. This makes it much easier to evaluate
x
the integral through W space! We shall not derive the final expressions. It suffices to say that
if we would deriveA ˆin the aboveway we obtain a matrix with eigenvalues and eigenvectors as
we have given above. Roe’s choice of average interface state variables can now be understood
as originating from the fact that this particular choice of parameter vector W makes q and f
x
quadraticinW.
7.1.5 The complete recipe ofaRoesolver
Although we have discussed the complete algorithm already, let us finish this section with a
point-by-pointrecipeforaRoesolver:
1. Determinefirst the∆tusingaCFL numberof0.5
2. Construct the state vector q = (ρe ,ρu,ρv,ρw,ρ) at each cell center. This q also auto-
tot i
maticallydefines thestates ateach sideoftheinterfaces: q = q ,q = q .
i−1/2,R i i−1/2,L i−1
3. ConstructRoe’s averages at thecell interfaces.
4. UsingRoe’s averages,create theeigenvectorsand eigenvalues
5. Computethefluxjumpovertheinterfaceanddecomposethisjumpintotheeigen-components
toobtainthevaluesof∆ ˜ q .
k,i−1/2
6. Computetheflux limiterforeach oftheeigen-components.
7. Computethesymmetricfluxaverage(f +f )/2,andaddthediffusivecorrec-
i−1/2,L i−1/2,R
tiontermusingtheflux limiterand the∆ ˜ q. Thiscreates theinterfaceflux.
8. Nowupdatethestatevectorusingtheinterfacefluxesandthe∆tcomputedusingtheCFL
condition.
9. Endoftimestep;offtothenexttimestep
7.2 Properties of the Roe solver
7.2.1 Strengths ofthe Roesolver
TheRoesolverisa verypowerfulsolver:
It resolves shocks and contact discontinuities very tightly (in roughly 3 grid points). It is
•
therefore significantlyhigherresolutionthan classicalhydrodynamicssolvers.
It does not require any artificial viscosity for shocks because it treats shocks directly. It is,
•
so tospeak, ashock-capturingscheme.
It has averylownumericalviscosity/diffusivity.
•
It isstrictlyconservingin mass,momentumand energy.
•

## 페이지 7
115
Because ittreats pressuregradientsas characteristics,soundwavesare propagatedwiththe
•
sameprecisionas movingmatter.
7.2.2 Problems ofthe Roesolver
The Roe solver has excellent performance for many problems, but sometimes it can produce
problems. Hereisa listofknownproblemsofthesolver:
Under some (rare) conditions it can try to create expansion shocks where it should cre-
•
ate smooth expansion waves. This is because the Roe solver is built in such a way as to
recognize Rankine-Hugoniot jump conditions even if they are the reverse. A Roe solver
decomposesanysmoothwaveintoaseriesofsmallcontactdiscontinuitiesorshocks. Even
for expansion waves it can happen that one of these shocks becomes strong and produces
an expansion shock. This is clearly unphysical and violates the entropy condition. If this
happens an entropy fix is necessary: a trick that disallowsan expansion shock to form. We
refer to LeVeque’sbookfordetails.
Justbehindstrongshocksin2-Dor3-Dflows,whentheshockisparalleltothegrid,some-
•
times waves can appear. This is an odd-even decoupling problem, and fixes have been
proposed which involvea minuteamount of diffusion parallel to the shock, but only in the
neiborhoodoftheshock.
Alsoforgrid-parallelshocksonecansometimesobservesevereprotrusionsappearingwhich
•
have a pyramid shape and a checkerboard pattern. This is known as the carbuncle phe-
nomenon. Thisproblemis rare, butifit happensitis hard tosolve.
Due to the fact that the total energy equations is used in Roe solvers, in case of extremely
•
supersonicflowsit can happenthat smallerrors inthemomentumequationcan yieldnega-
tivethermalenergies(becausee = e u2/2). Thiscanbeapotentiallyseriousproblem
th tot
−
of all schemes that use the total energy equation. Various fixes can be considered, which
can beuseful invariousregimes,butagenerally validsolutionis difficult.
Arare,butpossibleproblemoftheRoesolveristhatitdoesnotguaranteethattheinterface
•
fluxthatitproducesisphysical. ForinstanceintheRiemannproblemwithγ = 1.5,ρ = 1,
L
u = 2, P = 4/3and ρ = 4, u = 1 andP = 13/3thefirst orderupwindflux has an
L L R R R
−
energy flux but no mass flux (Eulerink & Mellema 1995). This is clearly unphysical, and
can lead to numericalproblems.
In general, though, the Roe solver is quite stable and very non-viscous. It is a truly high-
resolutionmethod.
7.3 The HLL family of solvers
WehaveseenthattheRoesolversplitsthe∆q (whereq isthestatevector)intotheirprojections
onto the basis of eigenvectors of the Jacobian. Let us write each of these components of ∆q as
∆ q wherek istheindexofwhicheigenvectorismeant. Eachofthe∆ q jumpsisadvectedwith
k k
itsownspeed: thecharacteristicvelocityλ ,whichistheeigenvalueoftheJacobianmatrix. This
k
is precisely thescenario depicted in Fig. 6.1. Each of thesemovingjumpsis in fact a wave, and
λ is the wave speed. We know from the true solutions of the Riemann problem for the Euler
k
equations (Fig. 6.3) that in reality not every wave is a jump: in particular the expansion wave

## 페이지 8
116
is not a jump. In the Roe solver we just approximate each of them to be a jump, based on the
semi-linearizedset ofequations.
AnotherRiemannsolver,whichalsoapproximatesallwavesasjumps,istheHLLRiemann
solverand its various derivatives. HLL stands for Harten, Lax and van Leer, who first proposed
a method of this kind. The difference between the HLL family of solvers and the Roe solver is
thewavepropagationspeedsλ andthewavedecompositionsof∆q into∆ q arenotrigorously
k k
derived from the eigenvectors and eigenvalues of some approximation of the Jacobian matrix.
Instead some simpler physical arguments are used to “guess” these values. Strictly speaking
the HLL family of solvers allow an infinite number of variants because it is partly left to the
developerof the HLL method which recipe to take to construct the wave propagation speeds λ
k
and thedecompositionof∆q intowaves∆ q.
k
Let us first look at HLL type solvers in a general sense, and later worry about how exactly
tocomputetheλ andthewaves∆ q.
k k
Suppose we have K waves (i.e. k = 1 K) ordered such that λ λ . Once we have
k k+1
··· ≤
decomposed ∆q into ∆ q with wave speeds λ we can write the state q(x,t) near the interface
k k
i+1/2 as:
q(x,t+∆t) = q + ∆ q q ∆ q (7.42)
i k i+1/2 i+1 k i+1/2
≡ −
k:x>x
i
X
+1/2
+λk∆t k:x≤x
i
X
+1/2
+λk∆t
That is: the state q(x,t) near the cell interface is split into K +1 regions. The first and the last
have q = q and q = q respectively. And in the wave fan region we have K 1 sub-regions
i i+1
−
of constant state q givenby the aboveequation. For the flux that use for the cell updates we are
onlyinterestedin q¯ q(x = x ,t+∆t), meaningweget:
i+1/2 i+1/2
≡
q¯ q + ∆ q q ∆ q (7.43)
i+1/2 i k i+1/2 i+1 k i+1/2
≡ ≡ −
k:λ X k∆t<0 k:λ X k∆t≥0
Strictly speaking,we can now computea flux f ¯ = f(q¯ ) and weare done: we now
i+1/2 i+1/2
haveawaytoexpresstheinterfacefluxofthisapproximationoftheRiemannsolution. However,
it turns out that a better (more stable and reliable) way to compute the interface flux is to note
thatonecan constructalso wavejumpsintheflux ∆ f andusethepropertythat:
k
∆ f = λ ∆ q (7.44)
k k k
This property is the equivalent of the Rankine-Hugoniot condition for shocks, but now applied
to any wave. It basically guarantees that wave k indeed propagates with speed λ . In this way
k
we can now construct the flux at the interface by adding up the jumps, like in the case of the
constructionofq¯ :
i+1/2
f ¯ f + λ ∆ q f λ ∆ q (7.45)
i+1/2 i k k i+1/2 i+1 k k i+1/2
≡ ≡ −
k:λ X k∆t<0 k:λ X k∆t≥0
ConstructingtheinterfacefluxinthiswayisthebasisoftheHLLfamilyofapproximateRiemann
solvers.
The above expression is still first order. To make the scheme second order one can use
Eq.(6.56), whichwerepeat hereusingthe∆ notation:
k
f n+1/2 =1(fn +fn )
i+1/2 2 i+1/2,R i+1/2,L
(7.46)
1 [θ +φ ˜ (ǫ θ )]∆ fn
− 2 k,i+1/2 k,i+1/2 k,i+1/2 − k,i+1/2 k i+1/2
k= X 1···K

## 페이지 9
117
where φ is the flux limiter of wave k. This is still precisely the same method of making
k,i+1/2
theschemehigherorderas weusedfortheRoe solver.
To complete our scheme we must ow choose λ and ∆q in a clever way. This is the topic
k k
oftherestofthissection.
7.3.1 The HLLsolver
The simplest solver of this kind is the original one. It ignores the middle wave (the mass-
advectionwave)anddecomposes∆qintotwowaves∆ q and∆ qwhicharetheforwardand
(−) (+)
backward moving sound waves. This gives us a left state q = q , a right state q =
L,i+1/2 i R,i+1/2
q andamiddlestateq which isassumedtobe:
i+1 M,i+1/2
λ q λ q +f f
(+) R (−) L L R
q = − − (7.47)
M
λ λ
(+) (−)
−
(where we dropped thei+1/2 for notation convenience). Using theaboveexpressionsone can
derivethattheflux at theinterface isthen:
f if λ 0
i (−)
≥
f ¯ = λ (+) fi −λ (−) fi+1+λ (+) λ (−) (qi+1 −qi) if λ < 0 < λ (7.48)
i+1/2   λ (+) −λ (−) (−) (+)
f if λ 0
i+1 (+)
≤


So what about the expressions for λ and λ ? There is a whole variety of proposed
(−) (+)
expressionsforthesevalues. ThesimplestisduetoDavis (1988):
λ = u a λ = u +a (7.49)
(−),i+1/2 i i (+),i+1/2 i+1 i+1
−
where a is thesound speed. But there are many other versions too. See the book by Toro for an
in-depthdiscussion.
OneofthemaindisadvantagesofthisHLL solveristhat itcannot keep contact discontinu-
itiessharp. Thisisnotsurprisingsincewehavenomiddlewaveinthisscheme.
7.3.2 The HLLC solver
A newer version of the HLL schemeis the HLLC scheme, where theC stands for central wave:
this is a method which does include the middle wave that is missing from the standard HLL
scheme. The general way to construct this scheme is the same as shown above. Instead of 2
waves and 3 regions of constant q we now have 3 waves and 4 regions of constant q. While the
general method isthesame, thedetails oftheconstructionoftheHLLCmethod (and itsvarious
estimates of the wave speeds) requires some more in-depth discussion. We refer to the book of
Toro forthesedetails.
7.4 Source extrapolation methods
One major disadvantage of Riemann solvers in general is that they are, by their structure, less
capable of “recognizing” (seme-)static solutions in which pressure gradients are compensated
by an external force (typically gravity). To demonstrate what is meant let us take the example
of a hydrostatic atmosphere (e.g. Earth’s atmosphere) with small perturbations on it (e.g. the
formation of clouds). We want that the unperturbed atmosphere is recognized by the method

## 페이지 10
118
in the sense that the method perfectly keeps the static atmosphere intact and does not produce
wiggles,orworse: entropy. A hydrostaticatmosphereobeys:
dP
= ρg (7.50)
dz −
where z is the vertical coordinate and g is the gravitational constant of the atmosphere (g
≃
1000cm/s2). Letus discretizethisas:
P P
i+1 − i = 1(ρ +ρ )g (7.51)
z z −2 i+1 i
i+1 i
−
and let us construct the solution by choosing P = Kργ with K constant (an adiabatic atmo-
sphere) and choosing ρ(z = 0) as the densityat the base. We can then integrate(for a choice of
K)frombottomtosomeheightabovethesurfaceusingEq.(7.51). Sincethisequationisimplicit
in ρ one must solve for each new ρ using for instance an iteration at each new grid point
i+1 i+1
untilEq.(7.51)issatisfied. Wethenget ahydrostaticatmospherethat isconsistent.
If we insert this into a time-dependent hydro code we want that this hydrocode leaves this
solution exactly intact (i.e. that it does not introduce perturbations). For classical numerical
hydroschemes ofChapter5 this isin fact not difficult,especiallynot ifastaggered grid isused.
This is because the ∂P/∂z term is treated as a source term in such methods. We then have two
source terms: the ∂P/∂z and the ρg term. If we discretize these two terms in exactly the
−
same way as in Eq.7.51, then both terms cancel out exactly (for this hydrostatic solution) and
the hydrostatic solution is kept exactly intact (to machine precision). We can then safely study
tiny perturbatations of this atmosphere without the worry that we may in fact be involuntarily
studyingtheintrinsicnoiseofthemethodinstead.
For Riemann solvers, however, this is not so easy. It is a fundamental property of these
methods to include the ∂P/∂z term in the advection part, while the gravity force remains a
source term (and can not be treated in the advection part). The pressure gradient force and the
gravityforcearethereforetreatedinfundamentallydifferentwaysandonecannotguaranteethat
theywillexactlycancel forhydrostaticsolutions.
To solve this problem Eulderink & Mellema (1995, A&ASup 110, 587) introduced the
conceptofspatialfluxextrapolation. Averysimilar,buteasiermethodwasproposedbyLeVeque
(1998,J.Comp.Phys.146, 346). Wewilluseacombinationofbothformalismshere.
Considerthegeneralized hyperbolicequationwithasourceterm:
∂ q(x,t)+∂ f(q(x,t)) = s(x) (7.52)
t x
The traditional way to do operator spliting is to first solve ∂ q(x,t) + ∂ f(q(x,t)) = 0 for one
t x
timestep usingfor instancea Riemann solverand then solve∂ q(x,t) = s(x) forthe sametime
t
step (by simply adding the source). This gives us the problem of not recognizing steady states.
A steadystateisasolutionoftheequation
∂ f(q(x,t)) = s(x) (7.53)
x
The source extrapolationmethod for time-dependent hydrodynamics is inspired on this station-
ary equation. At the start of each time step we construct a subgrid model q(x,t = t ) (for
n
x < x < x ) where q(x = x ,t = t ) = q such that within the cell q(x,t = t ) is a
i−1/2 i+1/2 i n i n
solution of 7.53. To make things simpler we assume that s(x) is constant within a cell, so we
get:
∂ f(q(x,t)) = s for x < x < x (7.54)
x i i−1/2 i+1/2

## 페이지 11
119
Fromthisequationwecouldinprinciplesolveforq(x,t) withincell iandthereby obtainvalues
ofq attheleftandrightsidesofeachinterface: q andq (wecomebackinanminute
L,i+1/2 R,i+1/2
to this). These are then the values we put into a Riemann solver to produce our interface flux
f which we use for the state update. It should be noted, however, that since now the states
i+1/2
on both sides of the interface are no longer spatially constant (they follow the subgrid model).
So inprinciplewehaveageneralizedRiemannproblemonthecell interface, inwhichthestates
are not constant. Such generalized Riemann problems are very difficult to solve. So instead, we
simplyignorethefact thatthestates arestrictlyspeaking notconstanton bothsides, and simply
use q and q as the two states of a classical Riemann problem which we then solve
L,i+1/2 R,i+1/2
withourfavoritemethod.
Now let’s come back to the solution of Eq. 7.54. If f(q) is a linear function of q, say
f(q) = uq whereu isavelocity,thenthesolutionofEq.7.54 issimple:
q = q 1∆x s /u (7.55)
R,i−1/2 i − 2 i i i
q = q + 1∆x s /u (7.56)
L,i+1/2 i 2 i i i
This works fine as long as u = 0. Once u approaches zero we are in trouble. Moreover, if f(q)
6
isanon-linearfunctionofq thenwecan write:
f = f(q ) 1∆x s (7.57)
R,i−1/2 i − 2 i i
f = f(q )+ 1∆x s (7.58)
L,i+1/2 i 2 i i
which is fine, but solving q from a given flux f is non-trivial, and in the case of
R,i+1/2 R,i+1/2
the Euler equations typically has two different solutions, or one single solution or no solutions.
It is therefore often unpractical to try to determine the q from f . It turns out,
L/R,i+1/2 L/R,i+1/2
however, that for Riemann solvers that are based entirely on propagating waves ∆ f = λ ∆ q
k k k
where ∆ is the k-th wave and λ is its propagation speed, one can use ∆f = f
k k i+1/2 R,i+1/2
−
f as input to the wave-decomposition routine while keeping q = q and q =
L,i+1/2 L,i+1/2 i R,i+1/2
q as the primitive variables used to compute the eigenvectors and eigenvalues. In particular
i+1
fortheRoesolverthishybridapproach works well.
Now how does this solve the problem of recognizing a steady-state solution? The trick is
thatifthelinearsubgridmodeldescribedinEq.(??)issufficientlyaccurate,thenonewillobtain
forthesteadystatesolution:
f = f (7.59)
L,i+1/2 R,i+1/2
meaningthat
∆f = 0 (7.60)
i+1/2
IfwenowuseEq.(7.46)then weget:
f n+1/2 = 1(fn +fn ) (7.61)
i+1/2 2 i+1/2,R i+1/2,L
because by virtueof ∆f = 0 the entire Riemann solver part drops out of the equation now.
i+1/2
What isleft is:
∆t
qn+1 = qn [f(qn ) f(qn )]+∆tsn (7.62)
i i − 2∆x i+1 − i−1 i
So ifweconstructoursteadystateinitialconditionsuch that
f(q ) f(q )
i+1 − i−1 +s = 0 (7.63)
i
2∆x
thenthemethodfinallyrecognizes thestaticsolutiondowntomachineprecision.

## 페이지 12
120
7.5 Employing slope limiters before the Riemann solver step
So far we have studied solvers in which we could clearly distinguish two or three wave fam-
ilies. We were then able to apply flux limiters (or equivalently, slope limiters) to each wave
(cf. Eq.7.46). This method ensures that the slope in each wave mode is taken into account and
thereforegivessecondorderaccuracy inspace.
Another method of making Riemann solvers higher-order is to apply slope limiters (not
flux limiters)beforetheRiemann problemissolved. Thetrick istoextrapolatethecell-centered
primitivevariablesρ,P,~utothecell-wallsusingalinearsubgridmodel. Wecanalsoextrapolate
the conserved quantitiesρ,ρ~u,ρe , whicheverproduces thebest results. This then gives us the
tot
left and right states at the cell walls (q and q ), which defines a Riemann problem
L,i+1/2 R,i+1/2
whichwecanthensolveusinganysolverwewant. ContrarytothefluxlimiterrecipeofEq.7.46
this slope limiter method can also be applied to Riemann solvers that do not approximate the
problem into jump-like waves. This is therefore a way to make the original Godunov solver
higherorder.
This method is in a way similarto Section 7.4, but there is an essential difference: here we
use neighboring points to compute the slope of the linear subgrid model (instead of the source
function). Wethereforegetnon-zeroslopesalsoforcaseswithoutsource. Wecanemployallthe
machinery of Chapter 4 to produce the best possible linear subgrid model using e.g. MINMOD
orSUPERBEE slopelimiters.
Onemajorproblemthatweencounterifwesimplyapplythismethodas-is,isthatitquickly
becomes unstable. It turns out (see Toro’s book) that this instability problem can be elegantly
solvedbyproducingadaptedleft-andrightinterfacestatesq˜ andq˜ fromtheinterface
L,i+1/2 R,i+1/2
states q and q that come out of the slope limiter method by advancing these half a
L,i+1/2 R,i+1/2
timestepin timeinthefollowingway:
1 ∆t
q˜ = q + [f(q ) f(q )] (7.64)
L,i+1/2 L,i+1/2 R,i−1/2 L,i+1/2
2∆x −
1 ∆t
q˜ = q + [f(q ) f(q )] (7.65)
R,i+1/2 R,i+1/2 R,i+1/2 L,i+3/2
2∆x −
(see book by Toro, but beware of different notation). Note that the left one is updated using
q and q , while the right one is updated using q and q . These equations
R,i−1/2 L,i+1/2 R,i+1/2 L,i+3/2
are saying that the subgrid model within each cell individually is advanced half a time step.
Usingthismethodweobtainastablehigher-orderscheme.
The method is now completed by inserting q˜ and q˜ into our favorite Riemann
L,i+1/2 R,i+1/2
solverand obtainingtheinterfaceflux withwhichweupdatethecellcentered statevariables.
NOTE:TheuseoftheslopelimitersbeforetheRiemannstepexcludestheuseofthesource
extrapolation method described in Section 7.4, and vice versa. If one wishes to use the source
extrapolationmethodthenonlytheflux limitermethodaftertheRiemannstep (Eq.7.46)can be
used.
7.6 The PPM Method
A very well-known Riemann solver method is the “Piecewise Parabolic Method” (Colella &
Woodward 1984, J.Comp.Phys. 54, 174). It was designed before many of the above described
methods were developed, and therefore it lies a bit off from the main track as described above,
but in large part it follows (and indeed pioneered) the same ideas. It has proved to be a pretty

## 페이지 13
121
Figure7.1. TheresultoftheRoesolverwithsuperbeefluxlimiteronaSodshocktubetestwith
ρ = 105, P = 1, u = 0, ρ = 1.25 104, P = 0.1, u = 0 and γ = 7/5. Solid line:
L L L R R R
×
analytic solution;symbols: Roesolver.
powerful method and is still very often used. We will describe it very briefly here, but we will
notgo intodetailsbecausethemethodis rathercomplexand has manyfine-tuningaspects.
The main idea of this Riemann solver is to use a reconstruction step before the Riemann
step (see Section 7.5). But while we used linear reconstruction in Section 7.5, the PPM method
uses quadratic reconstruction. In other words: starting from the cell-center values of the prim-
itive variables ρ, p and ~u each cell subgrid model is a parabola. In the PPM method care is
taken that no overshoots happen (TVD scheme) and that in general the reconstruction is well-
behaved. Using these parabolic subgrid models, the primitive variables on both sides of each
of the interfaces can be calculated. We know from Section 7.5 that if we directly insert these
values into our Riemann problem solver, we get an unstable scheme. The PPM method solves
thisusinganapproximation. Itfindsthefastestmovingleft-andright-characteristicsandmakes
an average of the primitive variables over these domains. This is the PPM version of the half-
step-interface-updatedescribed inSection 7.5. It isless mathematicallyrigorous,butin practice
itworks.
Nowtheseleft-andright-interfacevaluescanbeinsertedinaRiemannsolvercode. Again,
as in Section 7.4, the solution to the true (generalized) Riemann problem in this case is very
complexandnoanalyticsolutionsexistofgeneralizedRiemannproblemswithparabolicspatial
dependency of the variables on both sides. Therefore, as before, the approximation is made to
solve the classical Riemann problem, with constant states on both sides, even though we know
thatthestateson bothsidesare notconstant.
We refer to the original paper by Colella & Woodward 1984 for details of the method and
howthemethodiffine-tuned.
7.7 Code testing: the Sod shock tube tests
The Sod shock tube test of Section 6.3.2 can be used to test the performance of our computer
program. We leave it to the reader to text the algorithms of the previous chapter on this kind of
test. Here we merely shock the performance of the Roe solveron a test with ρ = 105, P = 1,
L L
u = 0,ρ = 1.25 104, P = 0.1,u = 0 and γ = 7/5. Theresultis shownin Fig.7.1.
L R R R
×
