# chap_9_impl_incompr

> 원본: `numerical-analysis/chap_9_impl_incompr.pdf` (0.1MB, 11 페이지 추출)

## 페이지 1
Chapter 9
Implicit integration, incompressible flows
The methods we discussed so far work well for problems of hydrodynamics in which the flow
speedsofinterestarenotordersofmagnitudesmallerthanthesoundspeed. Thereare, however,
manysituationsinwhichweareinterestedinflows thatareverysubsonic. Forinstancetheflow
of air in the Earth’s lower atmosphere, the flow of water in oceans, etc. In such cases it is rea-
sonable to assume that there is pressure equilibrium everywhere to the extent that the gas/fluid
will not be accelerated to velocities anywhere near the sound speed. In other words, the flow is
always very subsonic: |~u| ≪ C . In such cases we are not interested in the detailed propagation
s
of sound waves, but in the much slower movement of the fluid itself. Can we use the methods
of the previous chapter for such problems? Yes, we can, but it will become extremely compu-
tationally expensive to model any appreciable flow of the fluid. Here is why: if we determine
thetimestepfromtheCFL condition(seeChapter3), thenthetimestepislimitedby thefastest
characteristics. In this case these are clearly the sound waves. If, for example, our typical flow
movesatspeedsoflessthan0.01timesC ,thenthetimestepis100timessmallerthanrequired
s
for the advection of the fluid itself. So the fast characteristics may not be interesting for us, but
theydo exist,and notobeyingtheCFL conditionfor them(i.e. taking theCFL conditionforthe
fluid movement only, which gives a 100 times larger time step in our example) would simply
blow up our code. The problem here is that the sound waves exist, if we like them or not. And
theylimitthetimestep. Supposewewanttomodeltheflowoffluidfromtheleftboundaryofour
domaintotheright,over100gridpoints. Forpureadvection(disregardingthesoundwaves)the
CFLconditionwithCFLnumber0.5requiresoftheorderof200timestepsforthefluidtomove
into thedomain on theleft and out of thedomain on theright. But because the soundwaves are
much faster, say 100×faster, theylimitthetimestep toa 100×smallervalue, meaningthat our
model now requires 20000 time steps. It is clear that this is not very practical, and alternative
methods must be found to allow us to keep our time step such that it obeys the CFL condition
forthefluidmotiononly,notforthesoundwaves.
Problems of this kind, where the time scales of interest are much larger than the formal
shortest time scale of the problem, are called “stiff”. This is a very common complication in
numerical integration of ordinary and partial differential equations (PDEs). If the rapid modes
of the problem quickly relax to a secular equilibrium (i.e. a quasi-equilibrium), then one may
be more interested in the much longer time scale evolution of the system, without wanting to
waste CPU time on the short-time-scale modes that are anyway related to their quasi equilib-
rium,andhencedonotchangeontheseshorttimescales. Anexampleofatypical“stiff”partial
differential equation is that of the diffusion equation. The shortest time scales are represented
by the smearing-out of the narrowest peaks. In more mathematical terms: the highest~ k modes
133

## 페이지 2
134
damp out the quickest. In typical applications these highest~ k modes damp out so quickly that
they have reached their quasi-equilibriumalready in the first few time steps. The more interest-
ing longer timescale evolution (“secular evolution”) concerns much smaller~ k modes, i.e. much
longerwavelengthmodes. Thesecouldinprinciplebefollowedsufficientlyaccuratelywithtime
steps much larger than the formal CFL condition. The CFL conditionlimitsthe timestep to the
damping timeofthe modes with a wavelength as large as two grid points. However, sincethese
modes are expected to be always near their equilibrium, we are not interested in modeling this
systemattheseverysmalltimesteps. Numericalstability,however,forces us todo this,thereby
forcing usto wastealot ofCPU time.
To solve problems of “stiff” nature, such as the diffusion problem or the problem of very
subsonic flow, a fundamentally different way of integration of the partial differential equations
has to be introduced. For very subsonic flow we also make an approximation to the flow equa-
tions. All these techniques require the solution of large sets of coupled linear equations, and
the solution of these equations requires special techniques, which we will briefly outline here
(thoughthisisatopicthat deservesan entireone-semesterlecture!).
We willstart out witha simpleexampleofan ordinarydifferential equationto demonstrate
the principle of stiffness. Then we will concern ourselves with the diffusion equation and how
to solve this efficiently using “implicit integration”. We will then generalize this to 2-D and
3-D, and turn then to general methods for the solution of multi-dimensional parabolic partial
differentialequations.
We will then turn to the equations very subsonic (i.e. incompressible) flows. We shall see
thatthesolutionrequiressimilartechniquesasforparabolicPDEstosolveforthepressure. Once
thisisdone, wecan useourclassicexplicitadvectionschemesforthepropagationofthefluid.
9.1 Simple example: an ordinary differential equation
9.1.1 Stiffness ofan ordinary differential equation
Let usstart withasimpleexampleofastiffordinary differentialequation:
d q −1 0 q
1 1
= (9.1)
dt (cid:18)q 2(cid:19) (cid:18) 0 −100(cid:19)(cid:18)q 2(cid:19)
Supposeat t = 0 westart with q = 1 and q = 1. Nowlet us integratethisusing forward Euler
1 2
integration,i.e. simplefirst orderexplicitintegration:
qn+1 qn −1 0 qn
1 = 1 +∆t 1 (9.2)
(cid:18)qn+1 (cid:19) (cid:18)qn (cid:19) (cid:18) 0 −100(cid:19)(cid:18)qn (cid:19)
2 2 2
The CLF condition for this equation, with CFL number 0.5, is ∆t = 0.005. If we are interested
mainly in the behavior of q , then this time step is very small. For q alone a time step of
1 1
∆t = 0.5 would be fine. Of course, in this simple example we could indeed integrate q with a
1
differenttimestepthanq ,butinmorerealisticcases onecannotalwaysseparatethevariableso
2
easily. In such cases one mustintegratethe entire set of equations together, and a common time
step is required, which must then be the smallest of the two, i.e. ∆t = 0.005. For followingour
variable of interest, q , we now have to perform many hundreds of time steps, much more than
1
we wouldexpect judging solelyfrom the slowvariationof q . In fact, after theinitialfast decay
1
of q , even q does not change very much anymore, as it reached its equilibrium state already
2 2
long before q has changed appreciably. So in thisexampleweare taking very smalltimesteps,
1

## 페이지 3
135
much smaller than strictly required for following the variations of q and q . It is only required
1 2
fornumericalstability.
9.1.2 Implicitintegration: the backward Euler method
An efficient and very stable way to solve this stiffness problem is to use implicit integration,
which is also often called backward Euler integration. We haveseen already an exampleof this
for an ordinary differential equation (ODE) in chapter 3. The trick is to use not the values of q
attimet = t buttheirfuturevaluesattimet = t fortheevaluationoftheright-hand-sideof
n n+1
the equation. Since these future values are not yet known at t = t , this poses a chicken-or-egg
n
problem. This problemcan besolvedifonewrites theset of equationsforqn+1 such thatall the
futurevariables qn+1 that were initiallyon therighthand sideare now onthe left hand side. For
linearequationsthiscanthenbewrittenasamatrixequationwhichcanbesolvedusingstandard
matrixequationsolvers.
Let usput ouraboveexampleinimplicitform:
qn+1 qn −1 0 qn+1
1 = 1 +∆t 1 (9.3)
(cid:18)qn+1 (cid:19) (cid:18)qn (cid:19) (cid:18) 0 −100(cid:19)(cid:18)qn+1 (cid:19)
2 2 2
wherethedifferencewithEq.(9.2)isonlyinthelastvectorwherenwasreplacedbyn+1. Now
let usreorder then+1variablesto theleft and alln variablestotheright:
−1 0 qn+1 qn
1−∆t 1 = 1 (9.4)
(cid:20) (cid:18) 0 −100(cid:19)(cid:21)(cid:18)qn+1 (cid:19) (cid:18)qn (cid:19)
2 2
Ifwedefine thematrixM tobe:
−1 0
M = 1−∆t (9.5)
(cid:18) 0 −100(cid:19)
and vectorqto be
q
1
q = (9.6)
(cid:18)q 2(cid:19)
thentheabovematrixequationis:
Mqn+1 = qn (9.7)
Thisis thematrix equationwenow havetosolveat each timestep. For oursimpleexamplethis
becomes:
1+∆t 0 qn+1 qn
1 = 1 (9.8)
(cid:18) 0 1+100∆t(cid:19)(cid:18)qn+1 (cid:19) (cid:18)qn(cid:19)
2 2
whichcan beeasilysolved:
qn+1 = qn+1 /(1+∆t) (9.9)
1 1
qn+1 = qn+1 /(1+100∆t) (9.10)
2 2
Thenicepropertyofthissolutionisthatthereisnopositive∆tforwhichqn+1 orqn+1 becomes
1 2
negative. When usingtheexplicitEuler methodtaking ∆t larger than theCFL limitwill lead to
negative values. Implicit integration, as demonstrated here, is therefore unconditionally stable,
eventhoughforlarge∆toneshouldnotexpectthesolutiontobeaccurate. However,supposewe
take ∆t to be too large for an accurate integration of q , this is not too problematic, because we
2

## 페이지 4
136
areanywayinterestedmainlyinq inourexample. Couldaninaccurateintegrationofq ,inmore
1 2
complexexamples,compromisetheaccuracyofq ? Yes,itcould. Buttypicallythefastermodes
1
(inthiscaseq )quicklyreachasemi-steady-state(aquasi-equilibrium),andthisstateisreached
2
evenwhentakingverylargetimestepsforq . Thewayinwhichq reachesitsquasi-steadystate
2 2
may be inaccurate if one takes too large time steps, but once it reaches it semi-steady state, it
stays there and the implicit method gives the right answer for q from that point onward. So as
2
longasweareinterestedsolelyinq andwetakeatimestepthatissmallenoughforanaccurate
1
integration of q , then using an implicitmethod guarantees stabilityand accuracy for q , even if
1 1
theproblemismorecomplexthan shownabove.
Sodoesthismeanthattheabovesimpleimplicitintegrationmethodisasimplemethodthat
can easily be applied to any problem? The answer is, unfortunately,no. In theaboveexampleit
waseasytosolvethematrixequationbecausethematrixwasdiagonal. Inmoregeneralcasesthe
matrix will not be strictly diagonal, and may be pretty large. For instance, if one has a q vector
of 100 components, and the 100×100 matrix M has all its elements non-zero, then an analytic
solution for qn+1 from qn is not practical. One then needs to resort to standard matrix equation
solvers.
9.1.3 A standard matrixequation solver: LU decomposition
There are many different methods for solving matrix equations. I can warmly recommend the
book by Press et al. Numerical Recipes in C or Numerical Recipes in Fortran. Here we shall
focus onthemostpopularmethod,theLU decomposition.
Supposewewishtosolvethefollowingequation:
α 0 0 0 x y
11 1 1
α 21 α 22 0 0 x 2 y 2
= (9.11)
α α α 0 x y
31 32 33 3 3
    
α 41 α 42 α 43 α 44x 4 y 4
    
for (x ,x ,x ,x ). The matrix here is lower triangular, meaning that the elements above the
1 2 3 4
diagonal are all zero. For this special case the solution is simple. We start by solving the first
equation: x = y /α . Onceweknowthis,thesecondequationbecomesx = (y −α x )/α .
1 1 11 2 2 21 1 22
Since x is known, x is directly obtained by this expression. Next, we find x by x = (y −
1 2 3 3 3
α x −α x )/α ,etcuntilallvaluesofxareobtained. Equationsofthetype9.11aretherefore
31 1 32 2 33
triviallysolved. Alsoupper-triangularmatrixequationsare triviallysolvedinasimilarmanner:
β β β β x y
11 12 13 14 1 1
 0 β 22 β23 β 24x 2 y 2
= (9.12)
0 0 β β x y
33 34 3 3
    
 0 0 0 β 44x 4 y 4
    
Now,supposewewishtosolvethefollowingnon-trivialmatrixequation:
a a a a x y
11 12 13 14 1 1
a 21 a 22 a 23 a 24x 2 y 2
= (9.13)
a a a a x y
31 32 33 34 3 3
    
a a a a x  y 
41 42 43 44 4 4
    
Then unfortunately we do not have such a simple method. We can try to create an upper-
triangular or lower-triangular matrix equation out of this by Gaussian elimination. But a more

## 페이지 5
137
useful method is to try to write the matrix as a product of a lower-triangular matrix and an
upper-triangularmatrix:
a a a a α 0 0 0 β β β β
11 12 13 14 11 11 12 13 14
a 21 a 22 a 23 a 24 α 21 α 22 0 0  0 β 22 β23 β 24
= (9.14)
a a a a α α α 0 0 0 β β
31 32 33 34 31 32 33 33 34
    
a a a a  α α α α  0 0 0 β 
41 42 43 44 41 42 43 44 44
    
orinmatrixnotation:
A = L·U (9.15)
Findingthecomponentsof Land U forany givenmatrixA is not trivial,but numerousoff-the-
shelf routines are availableto make this LU-decompositionof the matrix A, for instance, in the
bookofPress et al, citedabove. But oncetheyare found,thesolutionto theequation
L·U·x = y (9.16)
iseasily foundusingtheabovesequentialprocedure.
ThenicepropertyofthisLU-decompositionmethodisthatoncethesetwotriangularmatri-
ces are found, the solution x can be found for a great number of vectors y without the need for
recomputingthematrices Land Uallthetime.
9.2 A 1-D diffusion equation
Supposewewishtosolvethefollowingdiffusionequation
∂q ∂ ∂q
− D = b (9.17)
∂t ∂x (cid:18) ∂x(cid:19)
where D is a diffusion constant. Let us assume D =constant and the grid spacing ∆x is also
constant. The source term b does not necessarily have to be constant. The forward Euler (i.e.
explicit)integrationoftheequationcan bewrittenas:
∆tD
qn+1 = qn + (qn −2qn +qn )+∆tb (9.18)
i i ∆x2 i+1 i i−1
TheCFL conditionforthisequationis
∆x2
∆t . 0.5 (9.19)
D
Thisconditionisveryrestrictiveforfinegridresolution(small∆x). Theshorttimescalecomes
about because the highest k modes (with a wavelength twice the grid spacing) have the shortest
timescale. It turnsout,however,thatthesehigh-k modesalsodamp outquickly,soafter ashort
time they have become irrelevant; we do not need to model them any longer. But these modes
are stillthereand if∆tislarger thantheCFL conditionthesemodesexplode.
So let uswritetheequation inimplicitform:
∆tD
qn+1 = qn + (qn+1 −2qn+1 +qn+1 )+∆tb (9.20)
i i ∆x2 i+1 i i−1

## 페이지 6
138
Nowsortthings:
∆tD
qn+1 − (qn+1 −2qn+1 +qn+1 ) = qn +∆tb (9.21)
i ∆x2 i+1 i i−1 i
Wecan writethisas amatrixequation:
Aqn+1 = qn +∆tb (9.22)
Thesolutionwouldthenformallybe:
qn+1 = A −1 (qn +∆tb) (9.23)
but in practice one never calculates the matrix
A−1,
nor its LU components. The reason is that
the matrix A is a sparse matrix, meaning that only a very limited subset of its elements are
non-zero. It requires therefore very little storage space to store the matrix A is the computer.
However,theinversematrixA−1 isnon-sparse. Typicallyallitselementsarenon-zero. Itwould
thereforerequirequiteabitofstoragespace,andmoreoveritwouldrequireanenormousamount
ofcomputationaleffort tocreate thematrixA−1.
Instead, there are various methods for solvingmatrix equations where the matrix is sparse.
The abovematrix has a special structure: it is tridiagonal. A tridiagonalmatrix of, say 7×7 has
thefollowingform:
b c 0 0 0 0 0
1 1
a
2
b
2
c
2
0 0 0 0
0 a b c 0 0 0
3 3 3
 
0 0 a
4
b
4
c
4
0 0 (9.24)
 
0 0 0 a
5
b
5
c
5
0
 
0 0 0 0 a b c 
6 6 6
 
0 0 0 0 0 a b 
7 7
 
→ Exercise: Provethat,forEq.(9.21),thematrixAhasatridiagonalform. Giveanexpression
for a , b and c for 2 ≤ i ≤ N −1 (where N is the grid size). At theleft boundary require
i i i
thatq = K (forsomearbitrarynumberK)andattherightboundaryrequirethat∂q/∂x = 0.
Once Eq.(9.21) is written in matrix form Eq.(9.22) with A a tridiagonal matrix, then the
solutionisrelativelysimple. Let’sassumewehaveN = 7,i.e.7gridpoints,sothatwecanwrite
thisequationinthefollowingway:
b c 0 0 0 0 0
qn+1 rn+1
1 1 1 1
a 2 b 2 c 2 0 0 0 0q 2
n+1
 r 2
n+1

0 a b c 0 0 0
qn+1 rn+1
3 3 3 3 3
    
0 0 a 4 b 4 c 4 0 0q 4 n+1  = r 4 n+1  (9.25)
    
0 0 0 a 5 b 5 c 5 0q 5
n+1
 r 5
n+1

    
0 0 0 0 a b c
qn+1

rn+1

 6 6 6  6   6 
0 0 0 0 0 a b
qn+1

rn+1

7 7 7 7
    
where r contains the entire right-hand-sideof the equation. One can simplystart an elimination
procedure:
qn+1 = (r −c qn+1 )/b (9.26)
1 1 1 2 1
qn+1 = (r −a r /b −c qn+1 )/(b −a c /b ) (9.27)
2 2 2 1 1 2 3 2 2 1 1
qn+1 = .... (9.28)
3

## 페이지 7
139
One sees that every new equation solves on variable but introduces a new one. However, once
one arrives at i = N then the equation does not introduce any new variables and the equation
gives the first actual number. One can then back-substitute everything from i = N to i = 1
andthesolutionisdone. Thisprocedureiscalledtheforward-eliminationbackward-substitution
method. It worksvery welland robustlyforproblemsinvolvingtridiagonalmatrices.
Oncethisequationissolved,theqn+1 valuesarefoundand thenexttimestepcan bemade.
i
9.3 Diffusion equation in 2-D and 3-D: a prelude
Nowlet usdo thesamethingfora2-D diffusionequation:
∂q ∂ ∂q ∂ ∂q
− D − D = b (9.29)
∂t ∂x (cid:18) ∂x(cid:19) ∂y (cid:18) ∂y(cid:19)
In discreteimplicitform:
∆tD ∆tD
qn+1 = qn + (qn+1 −2qn+1 +qn+1 )+ (qn+1 −2qn+1 +qn+1 )+∆tb (9.30)
i,j i,j ∆x2 i+1,j i,j i−1,j ∆y2 i,j+1 i,j i,j−1
and sortthis:
∆tD ∆tD
qn+1 − (qn+1 −2qn+1 +qn+1 )− (qn+1 −2qn+1 +qn+1 ) = qn +∆tb (9.31)
i,j ∆x2 i+1,j i,j i−1,j ∆y2 i,j+1 i,j i,j−1 i,j
How to write this in a matrix form? First we have to make a 1-D vector q out of the 2-D
arrangement ofvariablesq . Thiscan bedoneinthefollowingway (here: a4×4 grid):
i,j
q = (q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q ,q )T (9.32)
1,1 2,1 3,1 4,1 1,2 2,2 3,2 4,2 1,3 2,3 3,3 4,3 1,4 2,4 3,4 4,4
So for an N × N grid we get a vector q of length N = N N . The corresponding matrix A
x y x y
willthenhaveN ×N components,i.e.(N N )2 components. Again,mostofthesecomponents
x y
will be0, so we will want to store thesematrix elements in a cleverway, likethe a, b, c case for
the tridiagonal case. In this way we can keep the matrix storage manageable. For a 3-D grid all
of this goes similarly,and for an N ×N ×N grid we get a vectorq of lengthN = N N N
x y z x y z
andamatrixof(N N N )2 elements,againmostofwhichare0. Butletussticktothe2-Dcase
x y z
fornow.
Sowhatisthestructureofthismatrix? Thematrixwillbepartlytridiagonal,butitwillhave
side-bandstoo. See Fig.9.1.
→ Exercise: What is the location of the side bands in the matrix (i.e. how many rows or
columsoffsetfrom thetruediagonal)?
For this kind of matrix the forward elimination backward substitution method does not
work. Forthisweneed iterativesolversforsparsematrices.
9.4 Iterative solvers for sparse matrix equations
There is a large variety of iterative methods for solving sparse matrix equations. Some basic
methods are Jacobi iteration, Successive Overrelaxation (SOR), Incomplete LU factorization,
Gauss-Seidel iteration etc. These methods are not very efficient, but it turns out that in combi-
nationwithothermethodstheystillhavetheiruse.

## 페이지 8
140
Figure9.1. GraphicalrepresentationoftheAmatrixresultingfromthe2-Ddiffusionequation.
9.4.1 Conjugate gradientmethods
Herewewillfocusonaparticularclassofmethodscalledconjugategradientmethods(againwe
refer here to the book by Press et al. “Numerical Recipes”, but also to the book by Ferziger &
Peric “ComputationalMethodsforFluidDynamics”). Considerthegeneral matrixequation
Aq = b (9.33)
If and only if the matrix A is symmetric and positive definite one can devise the following
method. Defineafunction
1
f(q) = q·A·q−b·q (9.34)
2
At the point where f(q) has a minimum, q is a solution of the matrix equation. This minimum
islocated where
∇f = Aq−b = 0 (9.35)
proving that indeed this minimum corresponds to the solution of the matrix equation. The trick
is now to start with an initial guess and walk toward the point where the minimum is. At each
iterationkwemakeasearchdirectionp andwefindthevalueofaquantityα suchthatf(q )
k k k+1
isminimized,where q isgivenby:
k+1
q = q +α p (9.36)
k+1 k k k
So how do we determine p ? This could be done using the “steepest descent” method. This
k
methodis guaranteed to converge, butit can convergevery slowly. In particulariftheminimum
liesinaverylongandnarrowvalley. Theconjugategradientmethodisaversionofthismethod
inwhich thenewsearch directionp ischosen tobeas different from allthepreviousones as
k+1
possible. Let us definep and p toobeconjugatevectorsiftheyobey:
k l
p ·A·p = 0 (9.37)
k l
i.e. they are, so to speak, orthogonal with respect to the “metric” A. In the conjugate gradient
methodeachnewsearchdirectionisrequiredtobeconjugatetoallpreviousones. Thischoiceof
p ensuresthatifonefindstheα such thatf(q +α p ) isminimizedwithrespect
k+1 k+1 k+1 k+1 k+1
to α it is also minimized with respect to all previous α and p . THis means that if
k+1 l<k+1 l<k+1

## 페이지 9
141
onehasN = N N N gridpoints,thenthismethodisguaranteedtofindtheexactsolutioninat
x y z
mostN iterations. Inpractice,however,onedoesnotwanttostoreallprevioussearchdirections,
nor do the large amount of work to find a conjugateto a large number of vectors. So in practice
the number of successively conjugate search directions is taken to be a limited value, and after
that the algorithm is restarted. This does not guarantee convergence in a finite number of steps,
butstillitconvergesrelativelyrapidly.
Another version of this algorithm uses another scalar function to minimize: the length of
theresidualvectorr. Thisresidualis defined as:
r = Aq −b (9.38)
k k
Thefunctiontominimizeis then:
1 1
f(q) = r·r = |Aq−b| 2 (9.39)
2 2
This is the minimum residual method. It works for symmetric matrices, also those which are
non-positive-definite.
The above methods work fine, but they are restricted to symmetric matrices. There are
severalgeneralizationsofthistogeneralizeitdomoregeneralmatrices. Fortheabovementioned
basic conjugate gradient method there is a biconjugate gradient method (BCG method) which
does nothavethisrestriction. But itisalso notclearly linkedtominimizingafunction.
Fortheminimumresidualmethodthereisageneralizedversioncalledthegeneralizedmin-
imumresidualmethod(GMRES).Thisisaverystablemethodanddoesnothaveanyrestriction
on thematrix,except thatitis notdegenerate.
9.4.2 Implementation andpreconditioning
The nice property of this class of methods, also called Krylov subspace methods, is that it in-
volves only multiplications of the matrix A or AT with vectors supplied by the algorithm and
the computation of inner products between two vectors supplied by the algorithm. In fact, you
can, as a user, supply your own subroutine for multiplying either A or AT with a vector that
theconjugategradientsupplies,aswellasasubroutineforcomputingtheinnerproductbetween
two vectors. This leaves all the implementation and all the time-consuming computations in
yourownhandsandyoucan figureouthowtomostefficientlycomputethesematrix-vectorand
vector-vectorproducts.
Thisnicepropertyalsorevealsaweaknessofthesemethods. Bydefinitionamatrixproduct
with a vectoronlypropagates informationfrom one grid pointto its neighbors. So ifone has an
N × N grid then one cannot hope to get a solution with fewer than max(N ,N ) iterations,
x y x y
and generally it may take up to max(N2,N2) iterations. The reason is simply that one cell on
x y
the left of the grid does not “feel” anything from another cell on the right side of the grid until
thisinformationispropagated. EachiterationoftheKrylovmethodpropagatesinformationonly
a single cell, and since information may have to travel multiple times back-and-forth before a
solutionisfound, itcan takemanyiterations.
More mathematically one can say that this matrix is ill conditioned. If λ ···λ are the
1 N
eigenvaluesofthematrix,then theconditionnumberκisdefined as
λ
max
κ = (9.40)
λ
min
Ifthisnumberis largethenthematrixisillconditioned

## 페이지 10
142
One way of improving the situation is to use preconditioning of the matrix equation by
introducingapreconditioningmatrixΛ suchthatonesolvesthefollowingequation:
ΛAΛ
−1Λq
= Λb (9.41)
This equation is mathematically identical to the original one, but it is numerically different. If
one can find a suitable preconditioning matrix Λ, then the convergence can be sped up much.
Ideally Λ is as closely similaras A but stilleasy to invert. In theKrylov methodswhat happens
in practice is that the algorithm will ask you to solve the equation Λy = w for y for some
given vector w. If you take Λ = 1, then this is trivial: y = w and the method reduces to the
non-preconditioned method. If, however, Λ is cleverly chosen, then you can solve the equation
each time the algorithm asks you to do so, and the method can speed up a lot. Basically what
youneedtodoistofindaΛthatpropagatesinformationquicklyacrossthegridwithoutmaking
itdifficultto invert.
9.4.3 Libraries
It is in general not a good idea to try to program one’s own matrix equation solver. Libraries of
subroutines for doing this have been developed over decades, and it is generally a good idea to
lookforanappropriatelibraryandusethatlibraryasa“blackbox”. Hereisaveryincompletelist
ofsomeknownlibraries,someofwhichare freeware, someofwhichare proprietarysoftware:
• The subroutines associated with the book by Press et al. “Numerical Recipes in C” and/or
“Numerical Recipes in Fortran-77”.
http://www.nr.com/com/storefront.html
• SixPack: Linearsolversfor FiniteVolume/ FiniteDifferenceequations.
http://www.engineers.auckland.ac.nz/∼snor007/software.html
• Hypre: ScalableLinearSolvers.
https://computation.llnl.gov/casc/hypre/software.html
• PETSc: Portable,ExtensibleToolkitforScientific Computation.
http://www-unix.mcs.anl.gov/petsc/petsc-as/
But therearemanymorelibrariesavailable.
9.5 Incompressible fluid equations
Now let us return to the problem of very subsonic fluids. Very subsonic means in fact that one
can approximatethesystemas being incompressible. Thismeansthat
∇·~u = 0 (9.42)
andthedensityρ=constant. Sincethedensityisassumedtobeconstant,wedonotneed tosolve
the continuity equation anymore. But instead we get a condition on the pressure gradients. Let
uslook atthemomentumequation:
∂~u 1
= −~u·∇~u− ∇P (9.43)
∂t ρ

## 페이지 11
143
Ifwetakethedivergenceofthisequation,thenweobtain:
∂∇·~u 1
= −∇·(~u·∇~u)− ∇ 2 P (9.44)
∂t ρ
wherewehaveused∇ρ = 0. Ifwesay ∇·~u = 0 thenweobtain
∇ 2 P = −ρ∇·(~u·∇~u) (9.45)
In indexnotation,and withuseagainof∇·~u = 0 weobtain
∇ ∇ P = −ρ∇ u ∇ u (9.46)
k k k l l k
This means that the condition of incompressibility creates a Poisson equation for the pressure.
In numericalform thisbecomes:
∂ ∂P ∂ ∂(ρu u )
i j
= − (9.47)
∂x (cid:18)∂x (cid:19) ∂x (cid:20) ∂x (cid:21)
i i i j
How to solve this? One way to do so is to see the similarity between the Poisson equation
in 2-D and stationary solutions of the 2-D time-dependent diffusion equation. So one can use
the same methods as above, but then taking ∆t → ∞. Or one can keep ∆t finite or even small
enoughtodoexplicittimeintegrationuntilasteadystateisreached. Thisis,however,veryCPU
timeconsuming.
9.5.1 Boundary conditions
Supposewehaveflowinarestrictedvolume(apipeorariver),thentheboundaryconditionsare
suchthat~u·~n = 0,where~nisthenormaltothesurface. Thepressuregradientmustbesuchthat
thisremainstrueafteronetimestep. Multiplyingthemomentumequationwith~ngives:
∂~n·~u 1
= −~n·(~u·∇~u)− ~n·∇P (9.48)
∂t ρ
whichreduces to
1
n ∇ P = −~n u ∇ u (9.49)
k k k l l k
ρ
whichcan beimplementedas boundarycondition.
9.5.2 Numerical issues
In solving the Poisson equation for the pressure one must make sure that one uses the same
numerical methods for computing the source term of this equation as one uses for the update of
the velocities. If one does not do this, thezero divergencecannot be guaranteed. Also one must
start from a velocity field that is already divergence free, otherwise the solution of the Poisson
equationwillnothelp.
