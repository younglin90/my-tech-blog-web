# chap_3_advection_I

> 원본: `numerical-analysis/chap_3_advection_I.pdf` (1.2MB, 22 페이지 추출)

## 페이지 1
Chapter 3
Advection algorithms I. The basics
Numerical solutions to (partial) differential equations always require discretization of the prob-
lem. This means that instead of a continuous space dimension x or time dimension t we now
have:
x x x , ,x (3.1)
→
i
∈ {
1
···
Nx}
t t t , ,x (3.2)
→
n
∈ {
1
···
Nt}
In other words: we have replaced spacetime with a discrete set of points. This is called a grid
or a mesh. The numerical solution is solved on these discrete grid points. So we must replace
functions such as q(x) or q(x,t) by their discrete counterparts q(x ) or q(x ,t ). From now on
i i n
wewillwritethisas:
q(x ,t ) =: qn (3.3)
i n i
NOTE: The upper index of qn is not a powerlaw index, but just the time index. We must now
replacethepartialdifferentialequationalsowithadiscretizedform,withqn asthequantitieswe
i
wishtosolve. Ingeneralwewithtofindqn+1forgivenqn,sotheequationsmustbeformulatedin
i i
thewaytoyieldqn+1forgivenqn. Thereareinfinitewaystoformulatethediscretizedformofthe
i i
PDEs of hydrodynamics, and some formulations are better than others. In fact, as we shall find
out,thesimplestformulationstendtobeevennumericallyunstable. Andmanystablealgorithms
turn out to be very diffusive. The art of numerical hydrodynamics, or of numerical solutions to
PDEsingeneral,istoformulateadiscretizedformofthePDEssuchthatthesolutionsforqn for
i
giveninitialconditionq1 are numericallystableand areas closeas possibleto thetrueq(x ,t ).
i i n
Overthepast40years thishasturnedouttobeaverychallengingproblem,andeventothisday
research ison-goingto designevenbettermethodsthan before. Oneofthemainproblemis that
thereisnoidealanduniversallygoodmethod. Someproblemsrequireentirelydifferentmethods
thanothers,eventhoughtheysolveexactlythesameequations. Forexample: hydrodynamicsof
very subsonic flows usually requires different methods than hydrodynamics of superonic flows
with shock waves. In the first case we require higher-order precision algorithms while in the
second case we need so-called shock-capturing methods. We will discuss such methods in later
chapters.
Inthischapterwewillfocusourattentiontothefundamentalandeasytoformulateproblem
ofnumericaladvectiononagrid. AswehaveseeninChapter2,theequationsofhydrodynamics
can be reduced to signals propagating with three different speeds: the two sound waves and the
gas motion. These ‘signals’ are nothing else than the eigenvectors of the Jacobian matrix, and
are therefore combinations of ρ, ρu and ρe , or in other words the eigenvector decomposition
tot
37

## 페이지 2
38
coefficients (q˜ ,q˜ ,q˜ ). So it should be possible to formulate numerical hydrodynamics as a
1 2 3
numericaladvectionofthesesignalsoveragrid.
To simplifythings we will not focus on the full set of signals. Instead we focus entirely on
howascalarfunctionq(x,t) can benumericallyadvectedovera grid. Theequationissimply:
∂ q(x,t)+∂ [q(x,t)u(x,t)] = 0 (3.4)
t x
which istheconserved advectionequation. Thisproblem soundsnearly trivial,butit is farfrom
trivialinpractice. Infact, findingaproperalgorithmfornumericaladvectionofscalarfunctions
overa grid has been one of themain challenges for numerical hydrodynamicsin the early years
of hydrodynamics. We will in fact reduce the complexityof the problem even further and study
simply:
∂ q(x,t)+u∂ [q(x,t)] = 0 (3.5)
t x
withuisaconstant. Inthiscasetheequationisautomaticallyaconservationequationinspiteof
thefact thatu isoutsideofthedifferentialoperator.
Since not all readers may be familiar with numerical methods, we will start this chapter
witharecapitulationofsomebasicmethodsfortheintegrationoffunctions.
3.1 Prelude: Numerical integration of an ordinary differential equation
Inspiteofitssimplicity,theadvectionequationisa2-Dproblem(inx,t)whichthereforealready
naturallyhassomelevelofcomplexity. Tointroducesomeofthebasicconcepts thatwecan use
later, we first turn our attention to a simple problem: the solution to an ordinary differential
equation(ODE)such as
dq(t)
= F(t,q(t)) (3.6)
dt
where F(t,q) is a function of both t and q. We assume that at some time t = t we know the
0
valueof q and we wish to integratethis equation in timet using a numerical method. To do this
wemustdiscretizetimetindiscretestepst , t , t etc, and thevaluesofq(t) belongingtothese
0 1 2
time nodes can be denoted as q , q , q etc. So, given q , how can we compute q with i > 0?
0 1 2 0 i
Themoststraightforwardmethodis theforward Eulermethod:
q q
n+1 n
− = F(t ,q ) (3.7)
n n
∆t
whichcan bewrittenas an expressionforq :
n+1
q = q +F(t ,q )∆t (3.8)
n+1 n n n
This method is also called explicit integration, because the new value of q is explicitly given in
terms of the old values. This is the easiest method, but it has several drawbacks. One of these
drawbacksis thatitbecomes numericallyunstableifthetimestep∆tistaken toolarge.
Exercise: Considertheequation
→
dq(t)
= q(t)2 (3.9)
dt −
Write down the analytic solution (to later compare with). Assume q(t = 0) = 1 and
numerically integrate this equation using the forward Euler method to time t = 10. Plot

## 페이지 3
39
the numerical resulting function q(t) over the analytic solution. Experiment with different
time steps ∆t, and find out what happens when ∆t is taken too large. Derive a reasonable
condition for the maximum ∆t that can be allowed. Find out which ∆t is needed to get
reasonableaccuracy.
AwaytostabilizetheintegrationevenforverylargetimestepsistousethebackwardEuler
method:
q = q +F(t ,q )∆t (3.10)
n+1 n n+1 n+1
which is also often called implicit integration. This equation may seem like magic, because to
calculate q we need q itself! The trick here is that one can often manipulate the equation
n+1 n+1
such thatintheendq iswrittenin explicitform again. Forinstance:
n+1
dq(t)
= q (3.11)
dt −
discretizesimplicitlyto
q = q q ∆t (3.12)
n+1 n n+1
−
Whilethisis an implicitequation,onecan rewriteitto:
q
n
q = (3.13)
n+1
1+∆t
which is stable for all ∆t > 0. However, in many cases F(t,q) is non-linear, and this simple
manipulationisnotpossible. Inthatcaseoneiseitherforced tolinearizetheequationsaboutthe
currentvalueofq andperformthemanipulationswithδq q q ,oroneusesiteration,
n n+1/2 n+1 n
≡ −
inwhichafirstguessismadeforq andthisisre-computediterativelyuntilconvergence. The
n+1
lattermethodis, however,rathertime-consuming.
Whether implicit methods produce accurate results for large ∆t is another issue. In fact,
such implicit integration, while being numerically extraordinarily stable, is about as inaccurate
as explicitintegration.
An alternative method, that combines the ideas of both forward and backward Euler inte-
grationis themidpointrule:
q = q +F(t ,q )∆t (3.14)
n+1 n n+1/2 n+1/2
where n+1/2 stands for the position between t and t . Here the problem is that we do not
n n+1
knowq ,neithercurrently,noronceweknowq . ForproblemsofintegratingHamiltonian
n+1/2 n+1
systems this method can nevertheless work and turns out to bevery useful. This is because the
’coordinates’ q are located at t and the conjugate momenta p are located at t , and their
i n i n+1/2
time derivatives only depend on their conjugate (q on p and p on q). This forms the basis of
symplecticintegratorssuchas theleapfrog method.
An integration method very akin to the midpoint rule, but more readily applicable is the
trapezoidrule:
1
q = q + [F(t ,q )+F(t ,q )]∆t (3.15)
n+1 n n n n+1 n+1
2
It ishalf-implicit. Fortheabovesimpleexample(Eq. 3.11)wecan thuswrite:
1 1
q = q q ∆t q ∆t (3.16)
n+1 n n n+1
− 2 − 2

## 페이지 4
40
whichresultsin:
1 ∆t/2
q = − q (3.17)
n+1 n
1+∆t/2
This method, when generalized to multiple dimensional partial differential equations, is called
the Crank-Nicholson method. It has the advantage that it is usually numerically stable (though
not as stable as fully implicit methods) and since the midpoint is used, it is also naturally more
accurate. A variant of this method is the predictor-corrector method (or better: the most well-
knownofthepredictor-correctormethods)inwhichatemporatepredictionofq ismadewith
n+1
theexplicitforward Eulermethod,whichisthen usedas theq in thetrapezoid rule.
n+1
Sofarwehavealwayscalculatedq onthebasisoftheknownq (and,incaseofimplicit
n+1 n
schemes, on q as well). Such methods are either first order accurate (such as the forward
n+1
andbackwardEulermethods)orsecondorderaccurate(suchasthetrapezoidrule),buttheycan
neverbe ofhigherorder. However,thereexisthigher-ordermethodsforintegration. Theyeither
makepredictor-stepsinbetweent andt (thesearetheRunge-Kuttatypemethods)ortheyfit
n n+1
aLagrangepolynomialthroughq ,q (orevenq andfurther)tocomputetheintegralofthe
n n−1 n−2
ODE in the interval [t ,t ] for finding q (these are Adams-Bashforth methods). The first
n n+1 n+1
orderAdamsmethodisequaltotheforwardEulermethod. Thesecondandthirdorderonesare:
∆t
q = q + [3F(t ,q ) F(t ,q )] (3.18)
n+1 n n n n−1 n−1
2 −
∆t
q = q + [23F(t ,q ) 16F(t ,q )+5F(t ,q )] (3.19)
n+1 n n n n−1 n−1 n−2 n−2
12 −
However, when generalized to multi-dimensional systems (such as hydrodynamics equations)
such higher order multi-point schemes in time are not very often used. In astrophysics the
PENCILhydrodynamicscodeisacodethatusesRunge-Kuttatypeintegrationintime,butmost
astrophysicalcodes arefirst orderin time.
3.2 Numerical spatial derivatives
3.2.1 Second order expressions fornumerical spatial derivatives
To convert the PDEs of Eqs. (3.4,3.5) into a discrete form we need to formulate the derivatives
indiscreteform. Aderivativeisdefined as:
∂q q(x+∆x) q(x)
= lim − (3.20)
∂x ∆x→0 ∆x
For∆xwecouldtakex x ,butinanumericalcalculationwecannotdothelim because
i+1 i ∆x→0
−
itwouldrequireinfinitenumberofgridpoints. So thebest wecan dois write:
∂q q q q q
= i+1 − i + (∆x2) i+1 − i (3.21)
∂x x x O " x x
!i+1/2 i+1 − i i+1 − i
!
where∆x (x x ),an!dweassumeforthemomentthatthegridisconstantlyspaced. Note
i+1 i !
≡ −
that this is an approximate expression of the derivative defined in between the grid points x
i+1
and x . For this reason we denote this as the derivative at i+ 1/2, which is just a way to index
i
locations in-between grid points. Often one needs the derivativenot in between two grid points
(i+1/2),butprecisely at agridpoint(i). Thiscan bewritten as:
∂q q q q q
= i+1 − i−1 + (∆x2) i+1 − i−1 (3.22)
∂x x x O " x x
!i i+1 − i−1 i+1 − i−1
!
!
!

## 페이지 5
41
So dependingwhereweneed thederivative,wehavedifferentexpressionsforthem.
The (∆x2)inEqs.(3.21,3.22)isawayofwritingthedeviationbetweenthe‘true’deriva-
O
tive and the approximation. Of course, the true derivative is only defined as long as q(x) is
smoothly defined. In our numerical algorithm we do not haveq(x): we only have q , and hence
i
the ‘true’ derivativeis not defined. But it does show that if we re-express thewhole problem on
afiner grid,i.e. withsmaller∆x, then theapproximateanswerapproaches thetrueoneas∆x2.
To see this, we assume we know the smooth function q(x). We say that q = q(x ) and
i i
q = q(x ) = q(x +∆x) andweexpressq(x +∆x) as aTaylorseries:
i+1 i+1 i i
1 1
q(x +∆x) = q(x )+q!(x )∆x+ q!!(x )∆x2 + q!!!(x )∆x4 + (∆x4) (3.23)
i i i i i
2 6 O
wherethe! (prime)denotesthederivativetox. Thenwe insertthisintothenumerical derivative
at i:
q q q +q!∆x+ 1q!!∆x2 + 1q!!!∆x3 + q +q!∆x 1q!!∆x2 + 1q!!!∆x3 +
i+1 − i−1 = i i 2 i 6 i ···− i i − 2 i 6 i ···
2∆x 2∆x
1
= q! + q!!!∆x2 +
i 6 i ···
(3.24)
Thisshowsthatthedeviationsare oforder (∆x2).
O
3.2.2 Higher-order expressions fornumerical derivatives
The (∆x2) also shows that there must be various other expressions possiblefor the derivative
O
that are equally valid. Eq. 3.21 is an example of a two-point derivative at position i + 1/2.
Eq. 3.22 is also a two-point derivative, this time at position i, but it is defined on a three-point
stencil. A stencil around point i is a mini-grid of points that contribute to the things we wish to
evaluateati. Wecan also defineaderivativeation afive-pointstencil:
∂q q +8q 8q +q
= − i+2 i+1 − i−1 i−2 + (∆x4) (3.25)
∂x 12∆x O
!i
!
Note: thisexpressionis on!lyvalidfor aconstantly-spacedgrid!
!
Exercise: Showthat thisexpressionindeed reproduces thederivativetoorder (∆x4).
→ O
Some hydrodynamics codes are based on such higher-order numerical derivatives. Collo-
quiallyit is usuallysaid that higher-order schemes are moreaccurate than lower-order schemes.
However, this is only true if the function q(x) is reasonably smooth over length scales of order
∆x. In other words: the (∆x4) is only significantly smaller than (∆x2) if ∂5q(x)∆x4
O O x #
∂3q(x)∆x2 ∂ q(x). Higher-order schemes are therefore useful for flows that have no strong
x # x
discontinuitiesinthem. Thisisoftentrueforsubsonicflows,i.e.flowsforwhichthesoundspeed
ismuchlargerthanthetypicalflowspeeds. Forproblemsinvolvingshockwavesandothertypes
of discontinuities such higher-order schemes turn out to be worse than lower order ones, as we
willshowbelow.
3.3 Some first advection algorithms
Inthissectionwewilltryoutafewalgorithmsandfindoutwhatpropertiestheyhave. Wefocus
againon theadvectionequation
∂ q +u∂ q = 0 (3.26)
t x

## 페이지 6
42
Figure 3.1. Result of center-difference algorithm for advection of a step-function from left to
right. Solid line and symbols: numerical result. Dotten line: true answer (produced analyti-
cally).
with constantu > 0. The domain ofinterest is [x ,x ]. We assumethat the initialstateq(x,t =
0 1
t ) is given on this domain, and we wish to solve for q(x,t > t ). A boundary condition has to
0 0
bespecified atx = x .
0
3.3.1 Centered-differencing scheme
Thesimplestdiscretizationoftheequationis:
qn+1 qn qn qn
i − i +u i+1 − i−1 = 0 (3.27)
t t x x
n+1 n i+1 i−1
− −
in which we use the n + 1/2 derivative in the time direction and the i derivative in space. Let
usassumethatthespacegridisequally-spacedsothatwecanalwayswritex x = 2∆x.
i+1 i−1
−
Wecan then rewritetheaboveequationas:
∆t
qn+1 = qn u(qn qn ) (3.28)
i i − 2∆x i+1 − i−1
Thisisoneofthesimplestadvectionalgorithmspossible.
Let ustest itbyapplyingitto asimpleexampleproblem. Wetakex = 0, x = 100and:
0 1
1 for x 30
q(x,t = t ) = ≤ (3.29)
0 0 for x > 30
!
Asboundaryconditionatx = 0wesetq(x = 0,t) = 0. Letususeanx-gridwithspacing∆x =
1, i.e. we have 100 grid points located ati+1/2 for i [0,99]. Let us choose ∆t t t
n+1 n
∈ ≡ −
to be ∆t = 0.1∆x for now. If we do 300 time steps, then we expect the jump inq to be located
at x = 60. In Fig.3.1 weseetheresultthatthenumericalalgorithmproduces.
One can see that this algorithm is numerically unstable. It produces strong oscillations in
the downsteam region. For larger ∆t these oscillations become even stronger. For smaller ∆t
they may become weaker, but they are always present. Clearlythis algorithm is of no use. We
shouldfind abettermethod

## 페이지 7
43
Figure 3.2. Result of center-difference algorithm for advection of a step-function from left to
right. Solid line and symbols: numerical result. Dotten line: true answer (produced analyti-
cally).
3.3.2 Upstream(Upwind) differencing
One reason for the failure of the above centered-differencemethod is the fact that the informa-
tion needed to update qn in time is derived from values of q in both upstream and downstream
i
directions1. The upstream direction at some point x is the direction x < x (for u > 0) since
i i
that is the direction from which the flow comes. The downsteam direction is x > x , i.e. the
i
direction where the stream goes. Anythingthat happens to the flow downstream fromx should
i
neveraffect the valueofq(x ), because that informationshould flow further away fromx . This
i i
is because, by definition, information flows downstream. Unfortunately, for the centered dif-
ferencing scheme, information can flow upstream: the value of qn+1 depends as much on qn
i i+1
(downstream direction) as it does on qn (upstream direction). Clearly this is unphysical, and
i−1
thisisoneofthereasonsthat thealgorithmfails.
A bettermethodis, however,easilygenerated:
qn+1 qn qn qn
i − i +u i − i−1 = 0 (3.30)
t t x x
n+1 n i i−1
− −
which is, by the way, only valid for u > 0. In this equation the information is clearly only
from upstream to downstream. This is called upstream differencing, often also called upwind
differencing. Theupdateforthestateis then:
∆t
qn+1 = qn u(qn qn ) (3.31)
i i − ∆x i − i−1
If we now do the same experiment as before we obtain the results shown in Figure 3.2.
This looks already much better. It is not unstable, and it does not produce values larger than
the maximum value of the initial state, nor values smaller than the minimal value of the initial
state. It is also monotonicity preserving, meaning that it does not produce new local minima
or maxima. However, the step function is smeared out considerably, which is an undesirable
property.
1Thesearealsooftencalledupwindanddownwinddirections.

## 페이지 8
44
t
i!2 i!1 i i+1 i+2 x
Figure3.3. Graphicalrepresentation oftheback-tracing methodoftheupwindscheme.
InFig.3.3showsthe‘physical’interpretationoftheupstreamalgorithm. Itshowsthatifwe
want toknowwhat thevalueofq isat timen+1, then wecan trace back theflow withaspeed
i
u from time n+1 to timen. We land somewhere in the middlebetween grid pointi and grid
−
pointi 1(forpositiveu). Wesaythatqn+1 = qn(x = x u∆t),andwefindqn(x = x u∆t)
− i i − i −
by linearinterpolationbetweeni 1 andi. Ifwedo so,wearriveprecisely at Eq.(3.31).
−
3.4 Numerical diffusion
Thesmearing-outofthesolutioninSection3.3.2isaresultofnumericaldiffusion. Tounderstand
numerical diffusion, we first have to understand how true diffusion is modeled in numerical
methods. ThisiswhatwewilldoinSubsection??. Thenwewillanalyzenumericaldiffusionin
moredetail.
3.4.1 Intermezzo: The diffusionequation
Letus,fornow,forgetabouttheadvectionequationandconcentrateonanothertypeofequation:
∂ q D∂2q = 0 (3.32)
t − x
This is the diffusion equation for constant diffusion coefficient D. A delta function q(x,0) =
δ(x) willsmearoutas aGaussian:
1
q(x,t) = exp x2/h2 (3.33)
√πh −
! "
with
h(t) = √4Dt (3.34)
In discretizedform weobtain:
qn+1 q 2 qn qn qn qn
i − i D i+1 − i i − i−1 = 0 (3.35)
t t − x x x x − x x
n+1 − n i+1 − i−1 # i+1 − i i − i−1$
Forconstantgridspacingweobtain:
qn+1 q qn 2qn +qn
i − i D i+1 − i i−1 = 0 (3.36)
∆t − ∆x2
Thisshowsthatthecombinationqn 2qn +qn isa discreteway ofwritingadiffusionterm.
i+1 − i i−1

## 페이지 9
45
3.4.2 Numerical diffusionofadvection algorithms
So now let us go back to the pure advection equation. Even though this equation does not have
any diffusion in it, the numerical algorithm to solve this advection equation intrinsically has
some diffusion. In fact, there exists no numerical method without numerical diffusion. Some
algorithms have more of it, some have less, and there exist method to constrain the smearing-
out of discontinuities (see Section 4.5 on flux limiters). But in principle numerical diffusion is
unavoidable.
One way of seeing thisis by doingthe followingexercise. Consider theupwind scheme. It
usesthederivativei 1/2fortheupdateofthestateati. Inprinciplethisisabitcheating,since
−
one‘should’usetheiderivativefortheupdateati. So letus writethederivativeati 1/2 as:
−
q q q q q 2q +q
i i−1 i+1 i−1 i+1 i i−1
− = − ∆x − (3.37)
∆x 2∆x − 2∆x2
Theleft-hand-sideistheupstreamdifference,thefirsttermontheright-hand-sideisthecentered
differenceandthesecondtermontheright-hand-sidecanberecognizedasadiffusiontermwith
diffusionconstant
∆xu
D = (3.38)
2
This shows that the upstream difference scheme can be regarded to be the same as the centered
difference scheme supplemented with a diffusion term. The pure centered difference scheme
is unstable, but once a bit of diffusion is added, the algorithm stabilizes. The drawback is,
however, that the diffusion smears any features out. If one would define the centered difference
formulation of the x-derivative as the ‘true’ derivative (which is of course merely a definition),
then thenumerical diffusionof the upstream differencing scheme is quantified byD as given in
Eq.(3.38).
In practice it is not possible to perfectly define the diffusivity of an algorithm since the
centered difference formulation of the derivative is also merely an approximation of the true
derivative. But it is nevertheless a useful way of looking atthe concept of numerical diffusion.
In principleonecouldsay thatitis as ifweare solving
∆xu
∂ q +u∂ q ∂2q = 0 (3.39)
t x − 2 x
Clearly, for ∆x 0 the diffusion vanishes. This is obviously a necessary condition, otherwise
→
we would be modeling the true diffusion equation, which is not what we want. The diffusion
thatwesee hereismerely aby-productofthenumericalalgorithmweused.
Note that sometimes (as we shall see below) it is useful to add some viscosity on purpose
to an algorithm. This is called artificial viscosity. One could therefore say that the upstream
differencingis equalto centered differencingplusartificial viscosity.
3.5 Courant-Friedichs-Lewy condition
Nomatterhowstableanexplicitnumericalalgorithmis,itcannotworkforarbitrarilylargetime
step ∆t. If, in the above example (with ∆x = 1 and u = 1), we were to use the upstream
differencing method but we would take ∆t = 2, then the algorithm would produce completely
unstableresults. The reason is the following: The functionq is advected overa distance ofu∆t
in a time step ∆t. If u∆t > ∆x, then within a single time step the function is advected overa
largerdistancethanthegridspacing. However,withtheaboveupstreamdifferencingmethodthe

## 페이지 10
46
newqn+1dependsonlyontheoldqn andqnvalues. Thealgorithmdoesnotincludeinformation
i i−1 i
about the value of qn , but with such a large ∆t it should have included it. The algorithm does
i−2
not know (at least withina singletimestep)aboutqn and therefore it produces somethingthat
i−2
isclearly not asolution.
TokeepanumericalalgorithmstablethetimestephastoobeytheCourant-Friedrichs-Lewy
condition(CFL condition)which states that the domain of dependence of qn+1 of the algorithm
i
at time t = t should include the true domain of dependence at time t = t . Or in other
n n
words: nothing is allowed to flow more than 1 grid spacing within one time step. This means
quantitatively
∆x
∆t (3.40)
≤ u
So thehigherthevelocityu, thesmallerthemaximumallowedtimestep.
For the case that u u(x) (i.e. space-dependent velocity) this gives different time step
→
constraintsatdifferent locations. Theallowedglobaltimestepis thenthesmallestofthese.
Notalways onewantsto takethismaximumallowedtimestep. Typicallyonetakes:
∆t = Cmin(∆x/u) (3.41)
where C is the Courant number. If one takes this 1, then one takes the maximum allowed time
step. If itis0.5 thenonetakes halfofit.
The CFL condition is a nessecary (but not sufficient) condition for the stability of any ex-
plicit differencing method. All the methods we have discussed here, and most of the methods
we will discuss lateron, are explicitdifferencing methods. The work ‘explicit’points to the fact
that the updated state qn+1 is explicitly formulated in terms of qn . There exist also so called
i i±k
‘implicitdifferencing’methods,buttheyare oftentoo complexand thereforeless oftenused.
3.6 Local truncation error and order of the algorithm
Now that we have seen some of the basics of numerical advection algorithms, let us analyze
how accurate such algorithmsare. Let us defineq (x,t) to be an exact solution to the advection
e
equationandqnadiscretesolutiontothenumericaladvectionequation. Thenumericalalgorithm
i
willberepresented byatransportoperatorT:
qn+1 = T[qn] (3.42)
i i
whichisanotherwayofwritingthediscretizedPDE.Incaseoftheupstreamdifferencingmethod
we haveT[qn] = qn ∆tu(qn qn ) (cf. Eq. 3.31). Forthis methodtheT operatoris a linear
i i − ∆x i − i−1
operator. Note, incidently, that if the PDE is a linear PDE, that does not guarantee that the
transport operator T is also necessarily linear. Lateron in this chapter we will get to know non-
linearoperatorsthat represent linearPDEs.
Wecan alsodefinethediscretevaluesoftheexact solution:
qn q (x ,t ) (3.43)
e,i ≡ e i n
Thevaluesqn donotingeneral strictlyobeyEq. (3.42). But wecan applytheoperatorT toqn
e,i e,i
and compare toqn+1. In otherwords: we can seewhich error thediscreteoperatorT introduces
e,i
in one single time step compared to the true solution qn+1. So let us apply T to qn and define
e,i e,i
theonestep error(OSE)as follows:
OSE = T[qn ] qn+1 (3.44)
e,i − e,i

## 페이지 11
47
By usingaTaylorexpansionwecan writeqn+1 as:
e,i
∂q(x ,t) 1 ∂2q(x ,t)
qn+1 = qn + i ∆t+ i ∆t2 + (∆t3) (3.45)
e,i e,i ∂t 2 ∂t2 O
! "t=tn ! "t=tn
Ifweusetheupstreamdifferencescheme, wecan write:
∆t
T[qn ] = qn u(qn qn ) (3.46)
e,i e,i − ∆x e,i− e,i−1
wherewecan write:
∂q(x,t ) 1 ∂2q(x,t )
qn = qn n ∆x+ n ∆x2 + (∆x3) (3.47)
e,i−1 e,i − ∂x 2 ∂x2 O
! "x=xi ! "x=xi
So theOSE ofthisschemebecomes:
∂q(x,t ) 1 ∂2q(x,t )
OSE = u n ∆t+ u n ∆t∆x+u∆t (∆x2)
− ∂x 2 ∂x2 O −
! "x=xi ! "x=xi (3.48)
∂q(x ,t) 1 ∂2q(x ,t)
i ∆t i ∆t2 + (∆t3)
∂t − 2 ∂t2 O
! "t=tn ! "t=tn
Ifweignoreallterms ofhigherorderweobtain:
∂q(x ,t) ∂q(x,t )
i n
OSE = ∆t +u (∆t) (∆x) (3.49)
− ∂t ∂x −O −O
# ! "t=tn ! "x=xi $
FromthePDEweknowthatthefirsttwotermsbetweenbracketscancelidentically,soweobtain:
OSE = ∆t[ (∆t)+ (∆x)] (3.50)
O O
So whathappenswhen wemake∆tsmaller: theOSE getssmallerbyafactorof∆t2. However,
one must keep in mind that one now has to do more time steps to arrive at the same simulation
end-time. Thereforethefinalerrorgoesdownonlyas∆t,i.e.linearinsteadofquadratic. Thatis
whyitis convenientifwedefinetheso-calledlocaltruncationerror(LTE)as:
1
LTE (T[qn ] qn+1) (3.51)
≡ ∆t e,i − e,i
whichforthisparticularschemeis:
LTE = (∆t)+ (∆x) (3.52)
O O
In general an algorithm is called consistent with the partial differential equation when the
LTEbehaves as:
LTE = (∆tk∆xl−k) (3.53)
O
k=0,l
%
withl 1. TheLTEisoforderl, and thealgorithmissaid tobel-th order.
≤
Theupstreamdifferencingalgorithmisclearly afirst orderscheme.

## 페이지 12
48
3.7 Lax-Richtmyer stability analysis of numerical advection schemes
ThemerefactthattheLTEgoeswith (∆t)and (∆x)isnotasufficientconditionforstability.
O O
It says that the operator T truly describes the discrete version of the PDE under consideration.
But upon multiple successive actions of the operator T, representing the time sequence of the
function q, tiny errors could conceivably grow exponentially and eventually dominate the solu-
tion. Wewant tofind outunderwhichconditionsthishappens.
To analyze stability we need to first define what we mean by stability. To do this we must
defineanorm . bywhichwecanmeasurethemagnitudeoftheerror. Ingeneralwedefinethe
|| ||
p-normofafunctionE(x) as:
∞ 1/p
E = E(x) pdx (3.54)
p
|| || | |
!"−∞ #
Forthediscretized functionE thisbecomes:
i
∞ 1/p
E = ∆x E p (3.55)
p i
|| || | |
$ &
i=−∞
%
The most commonly used are the 1-norm and the 2-norm. For conservation laws the 1-norm is
attractive because this norm can be directly used to represent the conservation of this quantity.
However,the2-normisusefulforlinearproblemsbecauseitiscompatiblewithaFourieranalysis
oftheproblem(seeSection 3.8).
Nowsupposewestartatt = 0withafunctionq (x,t = 0)andwesetthediscretenumerical
e
solutionatthattimetothesevalues: q0 = q0 q (x ,0). Theevolutionintimeisnowgivenby
i e,i ≡ e i
asuccessiveapplicationoftheoperatorT,such thatat timet = t thediscretesolutionis:
n
qn = Tn[q0] (3.56)
i i
In each of these time steps the discrete solution acquires an error. We can write the total accu-
mulatedglobalerrorat timet = t as En defined as:
n i
En = qn qn (3.57)
i i − e,i
i.e. the difference between the discrete solution and the true solution. So when we apply the
operatorT to qn wecan write:
i
qn+1 T[qn] = T[qn +En] (3.58)
i ≡ i e,i i
So wecan nowwritetheglobalerrorat timet , En+1 as
n+1 i
En+1 = qn+1 qn+1
i i − e,i
= T[qn +En] qn+1
e,i i − e,i (3.59)
= T[qn +En] T[qn ]+T[qn ] qn+1
e,i i − e,i e,i − e,i
= T[qn +En] T[qn ]+∆tLTE[qn ]
e,i i − e,i e,i
Now in the next few paragraphs we will show that the numericalmethod is stable in some
norm . iftheoperatorT[]isa contractiveoperator,defined as an operatorforwhich
|| ||
T[P] T[Q] P Q (3.60)
|| − || ≤ || − ||

## 페이지 13
49
foranyfunctionsP andQ. To showthiswewrite
En+1 T[qn +En] T[qn] +∆t LTE[qn]
|| || ≤ || e − e || || e || (3.61)
En +∆t LTE[qn]
≤ || || || e ||
Ifweapply thisrecursivelyweget
N
EN ∆t LTE[qn] (3.62)
|| || ≤ || e ||
n=1
!
whereweassumethattheerroratt = t = 0iszero. Now,theLTEisdefinedalwaysonthetrue
0
solutionqn . So since the truesolutionis for sure well-behaved (numerical instabilitiesare only
e,i
expected to arise in the numerical solutionqn), we expect that the LTE[qn] is a number that
i || e ||
isbounded. If wedefineM tobe
LTE
M = max LTE[qn] (3.63)
LTE 1≤n≤N || e ||
whichis thereforealso aboundnumber(notsuject toexponentialgrowth),then wecan write:
EN N∆tM (3.64)
LTE
|| || ≤
orwitht = N∆t:
EN tM (3.65)
LTE
|| || ≤
Thisshowsthatthefinalglobalerrorisbound,i.e.notsubjecttorun-awaygrowth,iftheoperator
T iscontractive. Notethatthisanalysis,sofar, holdsbothforlinearoperatorsT[.]as wellas for
non-linearoperatorsT[.]. Wewillcovernon-linearoperators in thenextchapter.
If T[.] is linear one can write T[qn + En] T[qn] = T[En]. In this case the stability
e − e
requirementis:
T[En] En (3.66)
|| || ≤ || ||
which must be true for any function En. In Section 3.8 we will verify this for some simple
i
algorithms.
Sometimestheabovestabilityrequirementisloosenedabit. Theideabehindthisisthatwe
are not concerned if modes grow very slowly, as long as these modes do not start to dominate
thesolution. IftheoperatorT[.]obeys
T[P] T[Q] (1+α∆t) P Q (3.67)
|| − || ≤ || − ||
whereα issomeconstant(which wewillconstrainlater), then Eq.(3.61)becomes:
En+1 (1+α∆t) En +∆t LTE[qn] (3.68)
|| || ≤ || || || e ||
and therebyEq.(3.65)becomes:
EN tM eαt (3.69)
LTE
|| || ≤
One sees that the error growth exponentially in time, which one would in principle consider an
instability. But eαt is a constant that does not depend on ∆t. So no matter how large eαt is, as
long as the LTE is linear or higher in ∆t (a requirement for consistency) one can always find a
∆t small enough such that EN qN even though this might require a very large number
|| || # || e ||
of time steps for the integration. This means that for an operator T[.] obeying Eq.(3.67) the

## 페이지 14
50
algorithmis formally stable. In practice, of course, theα cannot be too large, or else one would
requiretoomanytimesteps(i.e. toosmall∆t) tobeofanypractical use.
Thisleadsustoafundamentaltheoremofnumericalintegrationmethods: LaxEquivalence
Theoremwhich saysthat:
Consistency+Stability Convergence
→
Inotherwords: ifanalgorithmisconsistent(seeEq.3.53)andstable(seeEq.3.69),thenonecan
be assured that one can find a small enough ∆t such that at time t the right answer is reached
downtoan accuracy ofchoice.
3.8 Von Neumann stability analysis of numerical advection schemes
Thetheoreticalstabilityanalysisoutlinedintheprevioussectionhasonlyreformulatedthecondi-
tionforstabilityasaconditionontheoperatorT[.]. Wenowanalyzewhetheracertainalgorithm
infactsatisfiesthiscondition. ForlinearoperatorstheVonNeumannanalysisdoesthisinFourier
space using the 2-norm. Also we will require strong stability,in the sense that we want to show
that T[En] En (i.e. withoutthe(1+α∆t) factor).
|| || ≤ || ||
Any function can be expressed as a sum of complex wave functions. For an infinite space
onecan thereforewritetheinitialconditionfunctionq(x) as
1 ∞
q(x) = q˜(k)eikxdk (3.70)
√2π
!−∞
Sincetheadvectionequation
∂ q +u∂ q = 0 (3.71)
t x
merelymovesthisfunctionwithvelocityu,thesolutionq(x,t) = q(x ut)translatesinaq˜(k,t)
−
givenby
q˜(k,t) = q˜(k)e−iukt (3.72)
which is just a phase rotation. In Fourier space, the true operator T [.] is therefore merely a
e
complex number: T = e−iuk∆t. As we shall see below, the numerical operator in Fourier space
e
is also a complex number, though in general a slightly different one. So we need to compare
thenumericaloperatorT[.]withthetrueoperatorT [.]tofindoutwhatthelocaltruncationerror
e
(LTE)is.
Formally, when we follow the logic of Section 3.7, we need to let the operator T[.] act on
theFouriertransformsofqn +En andqn andsubtractthem. Orsincetheoperatorislinear,we
e,i i e,i
mustapplyitto theFouriertransform ofEn. However,sincewehaveassumedthattheoperator
i
islinear,wecanalsodotheanalysisdirectlyonq˜n(k)(theFouriertransformofqn )andcheckif
e e,i
theresultingamplitudeis 1. TheadvantageisthatwecanthendirectlyderivetheLTEinterms
≤
of an amplitude error and a phase error. If the amplitude of the operator T is 1 for all values
≤
of k, ∆x and ∆t C∆x/ u (where u is the advection speed and C is the Courant number)
≤ | |
then we know that the functionq˜(k,t) is not growing exponentially,and therefore also theerror
is not growing exponentially. Moreover, we know that if thisamplitudeis much smaller than 1,
then the algorithm is very diffusive. We can also analyze thephase error to see if the algorithm
transportseach modewiththecorrect speed.

## 페이지 15
51
3.8.1 Analyzing thecentered differencing scheme
Let usdescretizethisfunctionas:
q0 := q(x = x ,0) = eikxi (3.73)
i i
Nowinsertthisintothecentered differencescheme:
∆t
qn+1 = qn u(qn qn ) (3.74)
i i − 2∆x i+1 − i−1
Weobtain
∆t ∆t
q1 = eikxi u(eik(xi+∆x) eik(xi−∆x)) = eikxi 1 u(eik∆x e−ik∆x) (3.75)
i − 2∆x − − 2∆x −
! "
Let usdefine:
∆t
! u (3.76)
≡ ∆x
and
β k∆x (3.77)
≡
thenwe can write
qn+1 = qnTC (3.78)
i i
withTT thetransfer function,which forcentered differencingis apparently
!
TC = 1 (eiβ e−iβ) (3.79)
− 2 −
TheC inthetransferfunctionstandsfor‘centered differencing’. Wecan writeTC as
TC = 1 i!sinβ (3.80)
−
Thistransferfunctionis mosteasily analyzedby computingthesquared magnitudeR
R = T∗T = (ReT)2 +(ImT)2 (3.81)
and thephaseΦ
ImT
tanΦ = (3.82)
ReT
whichforthisalgorithmare:
RT = 1+!2sin2β , tanΦT = !sinβ (3.83)
−
We can now compare this to our analytic solution (the solution that should have been pro-
duced): q(x,t) = eik(x−u∆t). Clearly thisanalytic solutionhasR = 1 and a phaseof Φ = uk∆t
(ifphaseismeasured negatively). Compared tothissolutionweseethat:
1. The centered differencing scheme diverges: the amplitude of the solution always gets
bigger. Forverysmalltimestepsthishappenswithafactor1+(uk∆t)2. Soclearlyitgets
better for smaller time steps (even if we have to take more of them), but it still remains
unconditionallyunstable.
2. The phase also has an error: uδt[sin(k∆x) k∆x]/∆x. For very small time steps the
−
phase error becomes: k3u∆t∆x2/6, which means that the phase error grows linearly in
−
time,independentof∆t.
These results confirm our numerical experience that the centered differencing method is uncon-
ditionallyunstable.

## 페이지 16
52
3.8.2 Nowadding artificial viscosity
We have seen in the numerical experiments of Section 3.3.2 that adding artificial viscosity (see
Section3.4.2)canstabilizeanalgorithm. Soletusnowconsiderthefollowingadvectionscheme:
∆t ∆t
qn+1 = qn u(qn qn )+D (qn 2qn +qn ) (3.84)
i i − 2∆x i+1 − i−1 ∆x2 i+1 − i i−1
Let usdefine
∆t
ν = D (3.85)
∆x2
sothat weget
"
qn+1 = qn (qn qn )+ν(qn 2qn +qn ) (3.86)
i i − 2 i+1 − i−1 i+1 − i i−1
Let usagaininsertq0 := q(x = x ,0) = eikxi sothat weobtain
i i
"
q1 = eikxi (eik(xi+∆x) eik(xi−∆x))+ν(eik(xi+∆x) 2eikxi +eik(xi−∆x))
i − 2 − −
(3.87)
"
= eikxi 1 (eik∆x e−ik∆x)+ν(eik∆x 2+e−ik∆x)
− 2 − −
! "
sothetransferfunctionbecomes:
"
TCD = 1 (eik∆x e−ik∆x)+ν(eik∆x 2+e−ik∆x) (3.88)
− 2 − −
orinotherterms:
TCD = 1 i"sinβ +2ν(cosβ 1) (3.89)
− −
TheR andΦare:
RCD = "2sin2β +(1+2ν(cosβ 1))2 (3.90)
−
and
"sinβ
tanΦCD = (3.91)
−1+2ν(cosβ 1)
−
Figure 3.4 shows the transfer function in the complex plane. Whenever the transfer function
exceedstheunitcircle,themodegrowsandthealgorithmisunstable. Eachoftheellipsesshows
the complete set of modes (wavelengths) for a given " and ν. None of the points along the
ellipse is allowed to be beyond the unit circle, because if any point exceeds the unit circle, then
thereexistsanunstablemodethatwillgrowexponentiallyand,soonerorlater,willdominatethe
solution.
From these figures one can guess that whether an ellipse exceeds the unit circle or not is
already decided for very smallβ (i.e. very close toT = 1). So if we expand Eq. (3.90) in β we
obtain
RCD 1+β2("2 2ν)+ (β3) (3.92)
" − O
Weseethat forthecentered-differencing-and-diffusionalgorithmto bestableonemusthave
ν "2/2 (3.93)
≥
Exercise: Argue what is the largest allowed " for which a ν can be found for which all
→
modesare stable.

## 페이지 17
53
Figure3.4. Thecomplextransferfunctionforthecentereddifferencingadvectionschemewith
addedartificialviscosity (imaginaryaxisisflipped). Theellipsesarecurvesofconstant advec-
tion parameter ! = u∆t/∆x (marked on the curves) and varyingβ (i.e. varying wavelength).
Thethicklineistheunitcircle. Left:ν = 0.25,right: ν = 0.1. Wheneverthetransferfunction
exceedstheunitcircle,thealgorithm isunstable sincethemodegrows.
Exercise: AnalyzetheupstreamdifferencingschemeofSection3.3.2withtheabovemethod,
→
show that it is stable, and derive whether (and if so, how much) this algorithm is more dif-
fusivethanstrictlynecessary forstability.
Clearly for ν "2/2 the scheme is stable, but does it produce reasonable results? Let us first
≥
studythephaseΦCD andcompareto theexpected value. Theexpectedvalueis:
Φ = uk∆t = "β (3.94)
− −
Comparing this to Eq. (3.91) we see that to first order thephase is OK, at least for smallβ. The
errorappearswhenβ getsnon-small,i.e.forshortwavelengthmodes. Thisisnotasurprisesince
shortwavelengthmodesareclearly badly sampledbyanumerical scheme.
What about damping? From the phase diagram one can see that if we choose ν larger
than strictly required, then the ellipse moves more to the left, and thereby generally toward
smaller RCD, i.e. strong damping. For small " (assuming we choose ν = "2/2) we see that the
ellipsesflatten. This means that short-wavelength(i.e. large β)modes are stronglydamped, and
evenlongerwavelengthmodes(theones that weshouldbeableto modelproperly)are damped.
Sincethisdampingisan exponentialprocess (happeningafter each timestepagain,and thereby
creating a cumulative effect), even a damping of 10% per timestep will result in a damping of
a factor of 10−3 after only 65 time steps. Clearly such a damping, even if it seems not too large
for an individualtime step, leads to totally smeared out results in a short time. This is not what
we would like to have. The solution should, ideally, move precisely along the unit circle, but
realistically this is never attainable. The thing we should aim for is an algorithm that comes as
closeas possibletotheunitcircle, and has anas smallas possibleerrorinthephase.
3.8.3 Lax-Wendroff scheme
If we choose, in the abovealgorithm, precisely enough artificial viscosity to keep the algorithm
stable,i.e.
1
ν = "2 (3.95)
2

## 페이지 18
54
then the algorithm is called the Lax-Wendroff algorithm. The update for the Lax-Wendroff
schemeisevidently:
! !2
qn+1 = qn (qn qn )+ (qn 2qn +qn ) (3.96)
i i − 2 i+1 − i−1 2 i+1 − i i−1
Interestingly,theLax-Wendroffschemealso has anotherinterpretation: that ofapredictor-
n+1/2 n+1/2
corrector method. In this method we first calculate the q and q , i.e. the mid-point
i−1/2 i+1/2
fluxesat half-time:
q n+1/2 = 1(qn +qn )+ 1!(qn qn) (3.97)
i−1/2 2 i i−1 2 i−1 − i
q n+1/2 = 1(qn +qn )+ 1!(qn qn ) (3.98)
i+1/2 2 i i+1 2 i − i+1
Then wewriteforthedesiredqn+1:
i
qn+1 = qn +!(q n+1/2 q n+1/2 ) (3.99)
i i i−1/2 − i+1/2
Workingthisoutwilldirectlyyield Eq.(3.96).
3.9 Phase errors and Godunov’s Theorem
The Lax-Wendroff scheme we derived in the previous section is the prototype of second order
advection algorithms. There are many more types of second order algorithms, and in the next
chapter we will encounter them in a natural way when we discuss piecewise linear advection
schemes. But most of the qualitativemathematical properties of second order linear schemes in
general can bedemonstratedwiththeLax-Wendroffscheme.
One very important feature of second order schemes is the nature of their phase errors.
UsingthefollowingTaylorexpansions
atanx = x 1x3+O(x4) cosx = 1 1x2+O(x4) sinx = x 1x3+O(x4) (3.100)
− 3 − 2 − 6
wecan writethedifferenceΦCD Φ :
e
−
!sinβ
δΦCD ΦCD Φ = atan +!β
e
≡ − − 1+2ν(cosβ 1) (3.101)
! − "
!β3 1 ν + 1!2
# 6 − 3
A phase error can be associated with alag#in space: th$e wave apparently moves too fast or
too slow. The lag corresponding to the particular phase error is: δx = δΦ/k δΦ/β. The lag
∝
perunittimeisthend(δx)/dt = δx/∆t δΦ/(β!). So thisbecomes
∝
d(δx)
β2 1 ν + 1!2 (3.102)
dt ∝ 6 − 3
# $
One sees that the spatial lag is clearly dramatically risingwhen β 1, i.e. for wavelength that
→
approach the grid size. In other words: the shortest wavelength modes have the largest error in
theirpropagationvelocity.
Nowsupposewewishto advectablock function:
1 for x < x
q(x) = 0 (3.103)
0 for x > x
0
%

## 페이지 19
55
Figure 3.5. The spurious oscillations which spontaneously arise if theLax-Wendroff method
isapplied toajumpsolution.
SuchablockfunctioncanberegardedasaFouriersumofwavesofvaryingwavelength. Insuch
a sharp jump all wavelengthsare represented. If we nowadvect this functionoverthegrid, then
weseethattheshortestwavelengthcomponentswilllagmostbehindwhilethelargerwavelength
modesdo relativelyfine.
For the upwind scheme (ν = 0) these phase errors simply smear out any jumps like jelly.
For the Lax-Wendroff scheme these phase errors produce spurious oscillations (see Fig. 3.5).
Notethat incontrasttotheunstablecentered-difference schemetheseoscillationsremainbound
and causenomajordamage. Yet, theyare clearly unwanted.
Can one find a second order scheme that does not have these spurious oscillations? There
aremethodsthatatleastproducelessstrongoscillations,suchastheFrommmethod(seeChapter
4). But there is a theorem, due to Sergei K. Godunov, that states that any linear algorithm for
solvingpartialdifferentialequations,with thepropertyofnot producingnew extrema, can be at
most first order. This is known as Godunov Theorem. There is therefore no hope of finding a
linear second order accurate scheme that does not produce these unwanted wiggles. In Chapter
4wewilldiscussnon-linearschemesthatcombinethehigherorderaccuracyandtheprevention
ofproducingunwantedoscillations.
3.10 Computer implementation (adv-1): grids and arrays
So far everything in this chapter was theoretical. Now let us see how we can put things in
practice. Everything here will be explained in terms of the computer programming language
IDL InteractiveData Language(orits publicdomain clone“GDL”,Gnu Data Language). This
language starts counting array elements always from 0 (like C, but unlike Fortran, although in
Fortran onecan settherangeby handto startfrom 0).
Let us write a program for testing the upwind algorithm and let us call it ‘advection.pro’.
Both thex-grid and thequantityq willnowbearrays in thecomputer:
nx = 100
x = dblarr(nx)
q = dblarr(nx)
qnew = dblarr(nx)

## 페이지 20
56
Wecan producearegulargridinxinthefollowingway
dx = 1.d0 ; Set grid spacing
for i=0,nx-1 do x[i] = i*dx
In IDL this can be done even easier with the commanddindgen, but let us ignore this for the
moment. Nowlet usput somefunctiononthegrid:
for i=0,nx-1 do if x[i] lt 30. then q[i]=1.d0 else q[i]=0.d0
Nowlet usdefinea velocity,a timestepand afinal time:
u = 1.d0
dt = 2d-1
tend = 30.d0
As aleftboundary condition(sinceu > 0)wecan take
qleft = q[0]
Nowthesimpleupwindalgorithmcan bedoneforgrid pointi=1,nx-1:
time = 0.d0
while time lt tend do begin
;;
;; Check if end time will not be exceeded
;;
if time + dt lt tend then begin
dtused = dt
endif else begin
dtused = tend-time
endelse
;;
;; Do the advection
;;
for i=1,nx-1 do begin
qnew[i] = q[i] - u * ( q[i] - q[i-1] ) * dtused / dx
endfor
;;
;; Copy qnew back to q
;;
for i=1,nx-1 do begin
q[i] = qnew[i]
endfor
;;
;; Set the boundary condition at left side (because u>0)
;; (Note: this is not explicitly necessary since we
;; didn’t touch q[0])
;;
q[0] = qleft

## 페이지 21
57
Figure3.6. Theplotresulting fromtheadvect.proprogram ofSection3.10.
;;
;; Update time
;;
time = time + dtused
endwhile
Nowwecan plottheresult
plot,x,q,psym=-6
At theend oftheprogram wemustputan
end
NowwecangointoIDLandtype.r advection.proandweshouldgetaplotonthescreen
(Fig. 3.6).

## 페이지 22
58
