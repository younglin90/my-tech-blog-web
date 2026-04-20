# chap_6_numhyd_riemann_1

> 원본: `numerical-analysis/chap_6_numhyd_riemann_1.pdf` (0.1MB, 13 페이지 추출)

## 페이지 1
Chapter 6
Riemann solvers I
The numerical hydrodynamicsalgorithms we have devised in Chapter 5 were based on the idea
of operator splitting between the advection and pressure force terms. The advection was done,
forallconservedquantities,usingthegasvelocity,whilethepressureforceandworktermswere
treated as source terms. From Chapter 2 we know, however, that the characteristics of the Euler
equationsarenotnecessarilyallequaltothegasvelocity. Wehaveseenthatthereexistaneigen-
vectorwhich indeedhas thegasvelocityas eigenvectors,λ = u, butthereare twoeigenvectors
0
which have eigenvalues λ± = u±C
s
which belong to the forward and backward sound propa-
gation. Mathematically speaking one should do the advection in these three eigenvectors, using
their eigenvalues as advection velocity. The methods in Chapter 5 do not do this. By extracting
thepressuretermsoutoftheadvectionpartandaddingthemasasourceterm,theadvectionpart
hasbeenreducedessentiallytoBurger’sequation,andthepropagationofsoundwavesisentirely
drivenbytheadditionofthesourceterms. Suchmethodsthereforedonotformallypropagatethe
soundwavesusingadvection,eventhoughmathematicallytheyshouldbe. Alltheeffortwehave
done in Chapters 3 and 4 to create the best advection schemes possible will therefore have no
effectonthepropagationofsoundwaves. Oncecouldsaythatfortwooutofthreecharacteristics
ouringeneousadvectionschemeisuseless.
Riemann solvers on the other hand keep the pressure terms within the to-be-advected sys-
tem. There is no pressure source term in these equations. The mathematical character of the
equations remains intact. Such solvers therefore propagate all the characteristics on equal foot-
ing. We shall see that Riemann solvers are based on the concept of the Riemann problem, so
we will first dig into this concept. We will then cover the purest version of a Riemann solver:
the Godunov solver, but we will then quickly turn our attention to linearized Riemann solvers,
whicharesimplertoprogramandareconceptuallymorecloselylinkedtotheconceptofcharac-
teristic transport. Perhaps the most powerful linear Riemann solver is the Roe solver which has
theparticularadvantagethatitrecognizes shockwaves and transportsall characteristics nicely.
As we shall see, Riemann solvers tend to have advantages, but also some disadvantages.
One can therefore not say that they are always the method of choice. However, for problems
involvingshockwaves,contactdiscontinuitiesandotherhigh-resolutionflowfeatures,Riemann
solvers remain unparallelled in keeping these flow features sharp. For that reason they are be-
comingevermorepopular.
Many of the things covered in this chapter and in the next were inspired by the book of
Randall LeVeque, “FiniteVolumeMethodsforHyperbolicProblems”.
95

## 페이지 2
96
6.1 Simple waves, integral curves and Riemann invariants
Before we can delve into the concepts of Riemann problems and, lateron, Riemann solvers,
we must first solidify our understanding of characteristic families, and the associated concepts
of simple waves, integral curves and Riemann invariants. Since these concepts are important
conceptually, but not of too great importance quantitatively, we shall remain brief here. Let us
recall thefollowingformoftheEulerequations(cf. Eq.6.1):
q 0 1 0 q
1 1
∂ q +
γ−3ρu2
(3−γ)u (γ −1) ∂ q = 0 (6.1)
t  2   2  x  2 
q −{γe u+(γ −1)u3} γe + 3(1−γ)u2 γu q
3 tot tot 2 3
     
whereq = ρ, q = ρu and q = ρe The(cid:8)eigenvaluesare (cid:9)
1 2 3 tot
λ = u−C (6.2)
1 s
λ = u (6.3)
2
λ = u+C (6.4)
3 s
witheigenvectors:
1 1 1
e = u−C e = u e = u+C (6.5)
1 s 2 3 s
     
h −C u 1u2 h +C u
tot s 2 tot s
     
where h = e + P/ρ is the total specific enthalpy and C = γP/ρ is the adiabatic sound
tot tot s
speed.
p
The definition of the eigenvectors depend entirely and only on the state q = (q ,q ,q ), so
1 2 3
in the 3-D state-space these eigenvectors set up three vector fields. We can now look for set of
statesq(ξ) = (q (ξ),q (ξ),q (ξ))thatconnecttosomestartingstateq = (q ,q ,q )through
1 2 3 s s,1 s,2 s,3
integration along one of these vector fields. These constitute inegral curves of the characteris-
tic family. Two states q and q belong to the same 1-characteristic integral curve, if they are
a b
connected viatheintegral:
b
q = q + de (6.6)
b a 1
Za
Theconceptofintegralcurvescanbeunderstoodtheeasiestifwereturntolinearhyperbolic
equationswithaconstantadvectionmatrix: inthatcasewecoulddecomposeq entirelyineigen-
components. A 1-characteristic integral curve in state-space is a set of states for which only the
component along the e eigenvector varies, while the components along the other eigenvectors
1
may be non-zero but should be non-varying. For non-linear equations the decomposition of the
fullstatevectorisnolongerausefulconcept,buttheintegralcurvesarethenon-linearequivalent
ofthisidea.
Typically one can express integral curves not only as integrals along the eigenvectors of
the Jacobian, but also curves for which some special scalars are constant. In the 3-D parameter
spaceofourq = (q ,q ,q )statevectoreachcurveisdefinedbytwoofsuchscalars. Suchscalar
1 2 3
fields are called Riemann invariants of the characteristic family. One can regard these integral
curvesnowasthecrosslinglinesbetweenthetwocontourcurvesofthetwoRiemanninvariants.
ThevalueofeachofthetwoRiemanninvariantsnowidentifieseachofthecharacteristicintegral
curves.

## 페이지 3
97
FortheeigenvectorsoftheEulerequationsabovetheRiemann invariantsare:
1-Riemanninvariants: s, u+ 2Cs
γ−1
2-Riemanninvariants: u, P (6.7)
3-Riemanninvariants: s, u− 2Cs
γ−1
The 1-and 3- characteristics represent sound waves. Indeed, sound waves (if they do not topple
overtobecomeshocks)preserveentropy,andhencetheentropysisaRiemanninvariantofthese
twofamilies. The2-characteristicrepresentsanentropywavewhichmeansthattheentropycan
varyalongthiswave. Thisisactuallynotawaveinthewayweknowit. Itissimplythecomoving
fluid,andadjacentfluidpackagesmayhavedifferententropy. ThefactthatuandP areRiemann
invariantsofthiswavecanbeseenbyintegratingthevector(1,u,u2/2)inparameterspace. One
seesthatρvaries,butudoesnot. Alsooneseesthatq = ρ(e +u2/2)variesonlyinthekinetic
3 th
energy component. The value ρe stays constant, meaning that the pressure P = (γ − 1)ρe
th th
remains constant. So while the density may increase along this integral curve, the e will then
th
decrease enough to keep the pressure constant. This means that the entropy goes down, hence
theterm“entropy wave”.
In time-dependent fluid motion a wave is called a simple wave if the states along the wave
all lie on the same integral curve of one of the characteristic families. One can say that this is
thenapurewaveinonlyoneoftheeigenvectors. Asimplewaveinthe2-characteristicfamilyis
a wave in which u =const and P =const, but in which the entropy may vary. A simplewave in
the 3-characteristic family is for instance an infinitesimally weak sound wave in one direction.
In Section 6.3 we shall encounteralso anothersimplewaveof the 1- or3- characteristic family:
ararefactionwave.
As we shall see in the section on Riemann problems below, there can exist situations in
whichtwofluidsofdifferententropyliedirectlynexttoeachother,causinganentropyjump,but
zero pressure or velocity jump. This is also a simple wave in the 2-family, but a special one: a
discretejumpwave. Thiskindofwaveiscalled acontactdiscontinuity.
Anotherjump-likewaveisashockwavewhichcanbeeitherfromthe1-characteristicfamily
or from the 3-characteristic family. However, shock waves are waves for which the Riemann
invariants are no longer perfectly invariant. In particular the entropy will no longer be constant
overashockfront. Nevertheless,shockfrontscanstillbeassociatedtoeitherthe1-characteristic
or 3-characteristic family. The states on both sides of the shock front however, do not lie on the
sameintegralcurve. TheylieinsteadonaHugoniotlocus.
6.2 Riemann problems
A Riemann problem in thetheory of hyperbolicequations is a problem in which theinitialstate
ofthesystemis defined as:
q for x ≤ 0
q(x,t = 0) = L (6.8)
q for x > 0
R
(cid:26)
In other words: the initial state is constant for all negativex, and constant for all positivex, but
differs between left and right. For hydrodynamic problems one can consider this to be a 1-D
hydrodynamics problem in which gas with one temperature and density is located to the left of
aremovablewall and gas withanothertemperatureand densityto theright ofthat wall. At time
t = 0 thewallis instantlyremoved,and itis watchedwhat happens.

## 페이지 4
98
Starting condition
q
1,2
x
After some time
q
1,2
x
Figure 6.1. Example of the solution of a linear Riemann problem with constant and diagonal
advectionmatrix. Top: initialcondition (solidlineisq ,dashedlineisq ). Bottom: aftersome
1 2
time,theq component hasmovedtotheright(λ > 0)whiletheq component hasmovedto
1 1 2
theleft(λ < 0).
2
For hydrodynamic problems such shock tube tests are used to test the performance of nu-
merical hydrodynamics algorithms. This was first done by (Sod 1978, J. Comp. Phys 27, 1),
hence the name Sod shock tube tests. But such tests were also carried out in the laboratory (see
e.g. thebook byLiepmann&Roshko).
6.2.1 Riemannproblems forlinearadvection problems
The simplestRiemann problemsare thoseoflinear advectionproblems withconstant advection
velocity,orconstantJacobianmatrix. Considerthefollowingequation:
q λ 0 q
∂ 1 + 1 ∂ 1 = 0 (6.9)
t q 0 λ x q
2 2 2
(cid:18) (cid:19) (cid:18) (cid:19) (cid:18) (cid:19)
ConsiderthefollowingRiemann problemforthissetofequations:
q for x < 0
q (x,0) = 1,l (6.10)
1 q for x > 0
1,r
(cid:26)
q for x < 0
q (x,0) = 2,l (6.11)
2 q for x > 0
2,r
(cid:26)
Clearly thesolutionis:
q (x,t) = q (x−λ t,0) (6.12)
1 1 1
q (x,t) = q (x−λ t,0) (6.13)
2 2 2
whichissimplythatthefunctionq (x)isshiftedwithvelocityλ andthefunctionq (x)isshifted
1 1 2
with velocityλ . An exampleis shownin Fig. 6.1 A very similarsolutionis found ifthe matrix
2
is not diagonal, but has real eigenvalues: we then simply decompose (q ,q ) into eigenvectors,
1 2
obtaining (q˜ ,q˜ ), shift q˜ and q˜ according to their own advection velocity (eigenvalue of the
1 2 1 2
matrix),and thenreconstruct theq and q from q˜ andq˜ .
1 2 1 2

## 페이지 5
99
t
x
Figure6.2. Thecharacteristics oftheproblem solvedinFig.6.1.
→ Exercise: Solveinthisway thegeneral Riemann problemfortheequation
q 0 1 q
∂ 1 + ∂ 1 = 0 (6.14)
t q 1 0 x q
2 2
(cid:18) (cid:19) (cid:18) (cid:19) (cid:18) (cid:19)
These examples are for hyperbolic equations with two characteristics, but this procedure
can bedoneforanynumberofcharacteristics.
Notethatifwelookatthisprobleminan(x,t)diagram,thenweseetwowavespropagating,
one moving with velocity λ and one with velocity λ . We also see that the solution is self-
1 2
similar:
q (x,t ) = q (xt /t ,t ) (6.15)
1,2 b 1,2 a b a
6.3 Riemann problems for the equations of hydrodynamics
Riemann problems for the Euler equations are much more complex than those for the simple
linear hyperbolic equations shown above. This is because of the strong non-linearity of the
equations. ARiemann problemfortheequationsofhydrodynamicsis defined as:
ρ ,u ,P for x < 0
ρ,u,P = l l l (6.16)
ρ ,u ,P for x > 0
r r r
(cid:26)
The general solution is quite complex and even the qualitative shape of the solution depends
stronglyon theRiemannproblemat hand. Inthissectionwe willdiscusstwo specialcases.
6.3.1 Special case: The converging flow test
ThesimplestRiemannproblemforthehydrodynamicequationisthatinwhichP = P ,ρ = ρ
l r l r
and u = −u with u > 0. This is a symmetric case in which the gas on both sides of the
l r l
dividing line are moving toward each other: a converging flow. From intuition and/or from
numerical experience it can be said that the resulting solution is a compressed region that is
expandingintheformoftwoshockwavesmovingawayfromeachother. Withouta-prioriproof
(weshallcheck a-posteriori)letusassumethatthecompressedregioninbetweenthetwoshock
waveshasaconstantdensityandpressure,andbysymmetryhasazerovelocity. Wealsoassume
thattheconverginggasthathas notyet gonethroughtheshockfront isundisturbed.
The problem we now have to solve is to find the shock velocity v (which is the same but
s
oppositein each direction) and the density and pressure in the compressed region: ρ , P . For a
c c

## 페이지 6
100
givenv theMach numberMoftheshockis:
s
u +v P
M = l s = (u +v ) l (6.17)
l s
C
s,l
sγρ
l
(we take by definition v > 0). We now need the Rankine-Hugoniot adiabat in the form of
s
Eq.(1.97),
ρ (γ −1)M2 +2 γ −1 2
1 = = + (6.18)
ρ (γ +1)M2 γ +1 (γ +1)M2
c
as wellas theconditionformassconservation
ρ (u +v ) = ρ v (6.19)
l l s c s
By writingv = v +u −u = (M−u /C )C inthelatterequationwe can eliminateρ /ρ
s s l l l s,l s,l l c
inbothequationsto obtain
γ −1 2 u
M2 + = M2 − l M (6.20)
γ +1 γ +1 C
s,l
whichreduces to
γ +1 u
M2 − l M−1 = 0 (6.21)
2 C
s,l
Thesolutionis:
1 γ +1 u (γ +1)2 u2
M = l ± l +4 (6.22)
2 2 C 4 C2
( (cid:18) (cid:19) s,l s s,l )
For our purpose we need to choose the positive root. One sees that there is always a solution,
and thatonecan find twolimits:
• Limit 1, u ≪ C : The solution is M = 1. This means that in this limit the shock wave
l s,l
reduces to asoundwave.
• Limit2,u ≫ C : ThesolutionisM = (u /C )(γ+1)/2. Thisisthestrongshocklimit:
l s,l l s,l
the compression reaches its maximum of ρ → ρ (γ +1)/(γ −1). The strong shock limit
c l
is the limit in which the pre-shock thermal energy is so small compared to the post-shock
valuethat itcan beregarded as beingzero.
6.3.2 Special case: Sod’s shock tube tests
A special case of a Riemann problem in Eulerian hydrodynamics is when the initial state has
zero velocity on both sides of the dividing point, but the pressure has a jump. We shall discuss
thesesolutionsherefollowingthebookby Bodenheimeret al. (2007). Thecompletesolutionof
theSodshocktubetestisratherdifficulttoderive,sohereweshallderiveonlythemostobvious
relations,and writedownotherrelationswithoutderivation.
Themostimportantfirststepistofindoutwhatthequalitativeformofthesolutionis. Here
werelyonexperience: Ifonesolvessuchproblemsusingnumericalhydrodynamicsorlaboratory
experiments one finds that the self-similar solution that follows from such a problem typically
has 5 regions which we shall call region 1,2,3,4,5 as depicted in Fig. 6.3. Region 1 and 5 have
states which correspond to the left and the right initial state respectively. Regions 3 and 4 have
steady states (independent of x within the region) and region 2 has an x-dependent state. This

## 페이지 7
101
1 2 3 4 5
Figure 6.3. The solution to the shock tube problem of Sod for γ = 7/5, ρ = 105, P = 1,
l l
ρ = 1.25×104 and P = 0.1, shown at time t = 5000. The regions 1to 5, as mentioned in
r r
thetext,areannotated atthetop.
region2representsanexpansionwave,alsocalledrarefactionwave. Thisisasimplewaveofthe
left-goingcharacteristicfamily(the1-characteristicfamilyintheterminologyofSection6.1). It
is the only non-constant region in the solution. The dividing line between region 3 and 4 is a
contact discontinuity, i.e. a line separating two fluids of different entropy but the same pressure
and the same velocity. This is a “wave” of the middle characteristic family (the 2-characteristic
family in the terminology of Section 6.1). Therefore u = u and P = P . The propagation
3 4 3 4
speedofthecontactdiscontinuityisthereforealsou = u andthelocationofthisdiscontinuity
c 4
atsometimetisx = u t. Regions4and5areseparatedbyaforwardmovingshockwave.
contact c
This is a jump in the forward moving characteristic family (the 3-characteristic family in the
terminologyof Section 6.1). Since u = 0 one can invokemass conservation to write the shock
5
propagationspeed u in termsofthevelocityu and thedensitiesinbothregions:
s 4
ρ
u = u 4 (6.23)
s 4
ρ −ρ
4 5
The location of the shock wave at time t is therefore x = u t. According to the Rankine-
shock s
Hugoniot conditions derived in Section 1.9 we can also relate the density ratio and the pressure
ratio overtheshock:
ρ P +m2P
4 = 4 5 (6.24)
ρ P +m2P
5 5 4
wherem2 = (γ−1)/(γ+1). Fromtheserelationswecanderivethevelocityinregion4,because
weknowthatu = 0. Weobtain
5
1−m2
u = (P −P ) (6.25)
4 4 5 sρ
5
(P
4
+m2P
5
)

## 페이지 8
102
Thisisaboutasfaraswegetontheshockfront. Letusnowfocusontheexpansionwave(region
2). The leftmost onset of the expansion wave propagates to the left with the local sound speed.
So we have, at some timet, this point located at x = −C t, where C = γP /ρ is the
wave s,1 s,1 1 1
sound speed in region 1. Without further derivation (see Hawley et al. 1984) we write that the
p
gasvelocityinregion2 can beexpressedas
(1−m4)P 1/γ γ−1 γ−1
u = 1 P 2γ −P 2γ (6.26)
2 s m4ρ 1 2
1 (cid:18) (cid:19)
Tofindthedividinglinebetweenregions2and3wenowsolvetheequationu = u ,i.e.Eq.(6.26)
2 4
− Eq.(6.25)= 0, for theonly remainingunknownP . We do thisusinga numerical root-finding
3
method, for instance the zbrent method of the book Numerical Recipes by Price et al.. This
will yield us a numerical value for P = P . Then Eq.(6.25) directly leads to u = u = u .
3 4 c 3 4
The Hugoniot adiabat of the shock (Eq. 6.24) now gives us ρ . Now with Eq. (6.23) we can
4
compute the shock velocity u , and thereby the location of the shock front x = u t. The
s shock s
density in region 3 can be found by realizing that none of the gas to the left of the contact dis-
continuity has ever gone through a shock front. It must therefore still have the same entropy as
the gas in region 1. Using the law for polytropicgases P = Kργ we can say that K is thesame
everywhere left of the contact discontinuity (i.e. in regions 1,2 and 3). Therefore we can write
that ρ = ρ (P /P )1/γ. At this point we know the density, the pressure and the gas velocity
3 1 3 1
in regions 1,3,4,5. We can therefore easily calculate any of the other quantitiesin theseregions,
such as the sound speed C or the internal thermal energy e . The remaining unknown region
s th
is region 2, and we also do not yet knowthelocation of theseparation between regions2 and 3.
Withoutderivation(see Hawleyet al. 1984)westatethatin region2:
x
u(x,t) = (1−m2) +C (6.27)
s,1
t
(cid:16) (cid:17)
which indeed has the property that u = 0 at x = −C t. We can find the location of the
s,1
separationbetweenregions2and3bynumericallysolvingu(x,t) = u forx. Theexpressionfor
3
thesoundspeedC (x,t)inregion2isnowderivedbynotingthatregion2isaclassicalexpansion
s
fan,inwhichtheleft-movingcharacteristicλ− must,bynatureofself-similarsolutions,havethe
form λ− ≡ u(x,t)−C
s
(x,t) = x/t. Thisyieldsforregion2:
P(x,t) x 2
C2(x,t) ≡ γ = u(x,t)− (6.28)
s ρ(x,t) t
(cid:16) (cid:17)
Also here we know that P(x,t) = Kρ(x,t)γ with the same K as in region 1. Therefore we
obtain:
ργ x 2 1/(γ−1)
ρ(x,t) = 1 u(x,t)− (6.29)
γP t
(cid:20) 1 (cid:21)
(cid:16) (cid:17)
from which P(x,t) can bedirectly derived usingP(x,t) = Kρ(x,t)γ, and thesound speed and
internal thermal energy follow then immediately. We now have the total solution complete, and
for a particular example this solution is shown in Fig. 6.3. Later in this chapter we shall use
these solutions as simple test cases to verify the accuracy and performance of hydrodynamic
algorithms.

## 페이지 9
103
t
x
Figure 6.4. Godunov’s method: solving a self-similar Riemann problem at each interface
(grey), and making sure that the time step is small enough that they do not overlap. The two
leftmostself-similarRiemannsolutionsjustmanagetotouchbytheendofthetimestep,which
meansthatthetimestepcannotbemadelargerbeforetheywillinterfere.
6.4 Godunov’s method
We can now apply what we learned about the solution of Riemann problems to devise a new
numerical method for numerical hydrodynamics. Consider our numerical solutionat some time
t tobe givenby qn. These are valuesofq givenat thecell centers located at x = x . We define
n i i
cellinterfacesx intheusualway(seeChapter4)tobelocatedinbetweenthecellcentersx
i+1/2 i
and x . As oursubgridmodelweassumethatat thestart ofthetimestepthestatewithineach
i+1
cell is strictly constant (piecewise constant method, see Chapter 4). At each interface the state
variablesnowdescribeajump. Ifwezoomintotheregionaroundthisinterfaceweseethatthis
is precisely the definition of a Riemann problem, but this time locally within the two adjacent
cells. We can now calculate what the self-similar solution of the Riemann problem at each cell
interface i + 1/2 would be. This is a subgrid analytic evolution of the hydrodynamic system
within each pair of cells. This self-similar solution is calculated at each interface, so in order
to preserve the self-similar character of these solutions we must prevent the solutions from two
adjacent interfaces to overlap. This is depicted in Fig. 6.4. The time step is therefore restricted
to
∆t ≤ min(∆t ) (6.30)
i
where
x i+1/2 −x i−1/2
∆t = (6.31)
i max(λ i−1/2,k+ )−min(λ i+1/2,k−)
where λ i−1/2,k+ denotes the maximum positiveeigenvalue at interface i−1/2, and will be 0 in
case no positiveeigenvalues exist at that interface. Likewise λ denotes the smallest (i.e.
i+1/2,k−
mostnegative)negativeeigenvalueat interfacei+1/2, or0 ifno negativeeigenvaluesexist.
How to proceed from here, i.e. how to create a numerical algorithmfrom this concept, can
beseen intwo differentway,which wewillhighlightinthetwonextsubsections.
6.4.1 Onewayto lookatGodunov’s method
At the end of the time step each cell i consists of three regions: a left region which is affected
by the Riemann solution at interface i − 1/2, a middle region which is not yet affected, and a
right region which is affected by the Riemann solution at interface i+1/2. Since we know the
(semi-)analytic solutions of the Riemann problems and we of course know the unaffected state
in the middle region, we can (semi-)analytically average all state variables over the cell. This
averagingthenresultsinthecell-centervalueofqn+1. Thisaveragingprocedureisverysimilarto
i
whatwasdoneinthedonor-cellalgorithm,butthistimethestateinthecellattheendofthetime
stepisfarmorecomplexthaninthesimpledonor-cellalgorithm. Becauseofthiscomplexitywe
shallnotwork thisoutinthischapter.

## 페이지 10
104
6.4.2 Another wayto lookatGodunov’s method
Another way to look at Godunov’s method is by looking at the flux at the interface. We know
that theRiemann solutionsaround the cell interfaces are self-similarin the dimensionlessspace
variable ξ = (x−x )/(t−t ). This means that the state at the interface in this solution is
i+1/2 n
constant in time (at least between t = t and t = t ). This then implies that the flux f is
n n+1 i+1/2
alsoconstantin thistimeinterval. We can thereforethen write:
fn −fn
qn+1 = qn −∆t i+1/2 i−1/2 (6.32)
i i x i+1/2 −x i−1/2
where fn and fn are the fluxes calculated from the Riemann problems at the cell in-
i+1/2 i−1/2
terfaces. Note that this is true as much for linear sets of hyperbolic equations as well as for
non-linear ones. The complexity still remains in determining the state in the Riemann problem
at the cell interfaces, but that is already much less difficult than determining theentire Riemann
solution and averaging over it. Nevertheless for hydrodynamics the method remains complex
and wewillthereforenotgo intotheGodunovmethodfortheseequations.
6.5 Godunov for linear hyperbolic problems: a characteristic solver
6.5.1 Examplefortwo coupled equations
Instead of demonstrating how a Godunov solver works for the full non-linear set of equations
of hydrodynamics, we show here how it works for linear hyperbolicsets of equations. The nice
thing is that in this case the Riemann problem at each cell interface can be solved analytically.
Moreover, we will then naturally be led to a new concept: that of a characteristic solver. For
linear problems Riemann solvers and characteristic solvers are identical. Later, when dealing
withthefullset ofnon-linearhydrodynamicsequations,weshallbeusingbothconcepts.
Let usconsiderthefollowingequation:
q a b q
∂ 1 + ∂ 1 = 0 (6.33)
t q c d x q
2 2
(cid:18) (cid:19) (cid:18) (cid:19) (cid:18) (cid:19)
wherethematrixisdiagonizableandhastworealeigenvalues. Wewishtosolvethisnumerically.
Since the advection matrix, in this example, is constant, we were able to bring it out of the ∂
x
operator without flux conservation violation. The way we proceed is first to define the state
vectoron theleft-and right-sideoftheinterface i+1/2:
q ≡ q (6.34)
i+1/2,L i
q ≡ q (6.35)
i+1/2,R i+1
Nowdefinetheeigenvaluesand eigenvectorsoftheproblem:
1
λ (±) = (a+d)± (a−d)2 +4bc (6.36)
2
n p o
and
λ +2d
e =
(±)
(6.37)
(±)
2c
(cid:18) (cid:19)
Note that we use indices (−) and (+) because in this special case the eigenvalues are clearly
identifiablewithleft-andright-movingcharacteristicsunlesstheproblemis“supersonic”inthat

## 페이지 11
105
both eigenvalues are negative or both are positive. In general we would simply use λ , λ etc.
1 2
Thisisjustanotationissue. Now,any state
q
q = 1 (6.38)
q
2
(cid:18) (cid:19)
can bedecomposedintotheseeigenvectors:
1 λ +2d
(+)
q˜ = q −q (6.39)
(−) 2 1
λ −λ 2c
(+) (−) (cid:26) (cid:27)
1 λ (−) +2d
q˜ = q −q (6.40)
(+) 2 1
λ (−) −λ (+) (cid:26) 2c (cid:27)
So wecan define thedecomposedstateoneach sideoftheinterface:
q˜ (−),i+1/2,L = q˜ (−),i (6.41)
q˜ = q˜ (6.42)
(+),i+1/2,L (+),i
q˜ = q˜ (6.43)
(−),i+1/2,R (−),i+1
q˜ = q˜ (6.44)
(+),i+1/2,R (+),i+1
Now we can construct the flux at the interface. Suppose that λ > 0, then clearly the flux for
1
q˜ is determinedsolelybyq˜ and notby q˜ (theupwindprinciple):
(+),i+1/2 (+),i+1/2,L (+),i+1/2,R
f ˜ (−),i+1/2 =
λ
λ
(
(
−
−
)
)
q
q
˜
˜
(
(
−
−
)
)
,
,
i
i
+
+
1
1
/
/
2
2
,
,
R
L
f
f
o
o
r
r
λ
λ
(
(
−
−
)
)
<
>
0
0 (6.45)
(cid:26)
and similarforf ˜ . Thetotal fluxfor q is then:
(+),i+1/2
f = f ˜ e +f ˜ e (6.46)
i+1/2 (−),i+1/2 (−) (+),i+1/2 (+)
WeseethatGodunov’smethodforlinearadvectionequationsisnothingelsethanthedonor-cell
algorithmapplied toeach characteristicseparately.
We can generalize this method to non-constant advection matrix. Consider the following
problem:
q a(x) b(x) q
∂ 1 +∂ 1 = 0 (6.47)
t q x c(x) d(x) q
2 2
(cid:18) (cid:19) (cid:20)(cid:18) (cid:19)(cid:18) (cid:19)(cid:21)
The procedure is now the same, except that we must do the eigenvector decompositionwith the
local matrixat theinterface i+1/2. Both theeigenvectorsand the eigenvaluesare nowlocal to
the interface, and so will the decomposition be. In this case q˜ (−),i+1/2,L 6= q˜ (−),i−1/2,R , while in
thecaseofconstantmatrixwehadq˜ (−),i+1/2,L = q˜ (−),i−1/2,R . Fortherestweconstructthefluxes
inthesameway asabovefortheconstantmatrix.
We see that in the simple case of linear advection problems, the Godunov method (based
on the Riemann problem) is actually nothing else than a characteristic solver: the problem is
decomposed into characteristics, which are advected each in their own directions. Indeed, for
linearproblemstheprincipleofusingRiemannproblemsateachinterfacetoperformthenumer-
icalintegrationoftheequationsisidenticaltotheprincipleofdecomposingintotheeigenvectors
of the Jacobian and advecting each component with its own eigenvalue as characteristic speed.
Inotherwords: ForlinearproblemsaRiemannsolverisidenticaltoacharacteristicsolver. This
is not true anymore for non-linear problems: as we shall see later on, a characteristic solver for
hydrodynamicsisnotatrueRiemann solverbutan approximateRiemannsolver orequivalently
alinearizedRiemannsolver. However,let us,fornow,sticktolinearproblemsabitlonger.

## 페이지 12
106
6.5.2 General expressions forGodunov solversforlinearproblems
Wecan makeageneral expressionfortheflux,forany numberofcharacteristics:
f = f ˜ e (6.48)
i+1/2 k,i+1/2 k
k=1···K
X
where K is the number of characteristics (i.e. number coupled equations, or number of eigen-
vectorsand eigenvalues),and where
1
f ˜ = λ (1+θ )q˜n +(1−θ )q˜n (6.49)
k,i+1/2 2 k k i k i+1
h i
where θ = 1 if λ > 0 and θ = −1 if λ < 0. This is identical to the expressions we derived
k k k k
inSubsection 6.5,butnowmoregeneral.
6.5.3 HigherorderGodunov scheme
As we know from Chapter 4, the donor-cell algorithm is not the most sophisticated advection
algorithm. We therefore expect the solutions based on Eq. (6.49) to be smeared out quite a bit.
In Chapter 4 we found solutions to this problem by dropping the condition that the states are
piecewise constant (as we have done in the Godunov scheme so far) and introduce a piecewise
linearsubgridmodel,possiblywithaflux limiter. In principle, forlinearproblemstheGodunov
schemeisidenticaltotheadvectionproblemforeach individualcharacteristic, andthereforewe
canapplysuchlinearsubgridmodelsheretoo. InthiswaywegeneralizetheGodunovschemein
such a way that we havea slightlymorecomplex subgridmodelin each cell (i.e. non-constant),
buttheprincipleremainsthesame. At each interface wedefiner˜
k,i−1/2
:
q˜ k n q˜ , k n i , − i − 1 − q˜ k n q˜ , k n i , − i− 1 2 for λ k,i−1/2 ≥ 0
r˜n =  (6.50)
k,i−1/2
   q q ˜ ˜ k k n n , , i i+ − 1 q˜ − k n , q˜ i− k n , 1 i for λ k,i−1/2 ≤ 0
where again k denotes theeigenvect or/-value,i.e. thecharacteristic. Wecan now define theflux

limiterφ ˜ (r˜ k,i−1/2 ) for each of these characteristics according to the formulae in Section 4.5 (i.e.
Eqs.4.39,4.40, 4.41). Then theflux isgivenby(cf. Eq.4.38)
1
f ˜n+1/2 = λ (1+θ )q˜n +(1−θ )q˜n +
k,i−1/2
2
k,i−1/2 k,i−1/2 k,i−1/2,L k,i−1/2 k,i−1/2,R
(6.51)
1
|λ
h
| 1−
λ k,i−1/2 ∆t
φ(r˜n )(q˜n −q˜n
i
)
2
k,i−1/2
∆x
k,i−1/2 k,i−1/2,R k,i−1/2,L
(cid:18) (cid:12) (cid:12)(cid:19)
(cid:12) (cid:12)
Itisuseful,forlater,toderive(cid:12)analternativ(cid:12)eformofthissameequation,whichcanbeobtain
(cid:12) (cid:12)
with a bit of algebraic manipulation starting from Eq. (6.51). We use the identity |λ | =
k,i−1/2
θ k,i−1/2 λ k,i−1/2 and thedefinitionǫ k,i−1/2 ≡ λ k,i−1/2 ∆t/(x i −x i−1 ) and obtain:
f ˜ k n , + i− 1 1 / / 2 2 = 2 1λ k,i−1/2 (q˜ k n ,i−1/2,R +q˜ k n ,i−1/2,L ) (6.52)
− 1λ (q˜n −q˜n )[θ +φ ˜ (ǫ −θ )]
2
k,i−1/2 k,i−1/2,R k,i−1/2,L k,i−1/2 k,i−1/2 k,i−1/2 k,i−1/2
whereφ ˜ k,i−1/2 ≡ φ(r˜ k,i−1/2 ). If wedefine thedecomposedfluxes at theleft andright sideofthe
interfaceas
f ˜ = λ q˜ (6.53)
k,i−1/2,L i−1/2 k,i−1/2,L
f ˜ = λ q˜ (6.54)
k,i−1/2,R i−1/2 k,i−1/2,R

## 페이지 13
107
thenwe obtain:
f ˜n+1/2 =1(f ˜n +f ˜n )
k,i−1/2 2 k,i−1/2,R k,i−1/2,L (6.55)
− 2 1(f ˜ k n ,i−1/2,R −f ˜ k n ,i−1/2,L )[θ k,i−1/2 +φ ˜ k,i−1/2 (ǫ k,i−1/2 −θ k,i−1/2 )]
Nowwecanarriveatourfinalexpressionbyaddingupallthepartialfluxes(i.e. thefluxesofall
eigen-components):
f n+1/2 =1(fn +fn )
i−1/2 2 i−1/2,R i−1/2,L
(6.56)
− 1 2 (f ˜ k n ,i−1/2,R −f ˜ k n ,i−1/2,L )[θ k,i−1/2 +φ ˜ k,i−1/2 (ǫ k,i−1/2 −θ k,i−1/2 )]
k=1···K
X
Thisisourfinal expressionforthe(time-step-averaged)interfaceflux.
Thereare anumberofthingswecan learn from thisexpression:
1. The interface flux is the simple average flux plus a diffusive correction term. All the
ingenuityofthecharacteristicsolverliesinthediffusivecorrectionterm.
2. The flux limiter can be seen as a switch between donor-cell (φ ˜ = 0) and Lax-Wendroff
(φ ˜ = 1), where we here see yet again anotherinterpretation ofLax-Wendroff: themethod
in which the interface flux is found using a linear upwind interpolation (in contrast to
upwinding,where the new state is found using linear upwind interpolation). Of course, if
φ ˜isoneoftheotherexpressionsfrom Section4.5, weget thevariousotherschemes.
In allthesederivationswemustkeep in mindthefollowingcaveats:
• Now that the states in the adjacent cells is no longer constant, the Riemann problem is no
longerself-similar: Theflux at theinterface changes withtime.
• In case the advection matrix is non-constant in space, the determination of the slopes be-
comes a bit less mathematically clean: Since the eigenvectors now change from one cell
interfacetothenext,themeaningofq˜ −q˜ isnolongeridenticaltothemean-
k,i+1/2,R k,i+1/2,L
ingofq˜ k,i−1/2,R −q˜ k,i−1/2,L . Althoughthemethodworkswell,themathematicalfoundation
forthismethodisnowslightlyless strong.
