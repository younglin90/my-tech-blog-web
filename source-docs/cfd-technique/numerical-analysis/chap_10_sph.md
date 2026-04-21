# chap_10_sph

> 원본: `numerical-analysis/chap_10_sph.pdf` (0.1MB, 8 페이지 추출)

## 페이지 1
Chapter 10
Smooth Particle Hydrodynamics Solvers
So far we have only looked at method for solving the equations of hydrodynamics based on
a fixed pre-defined grid. These methods are very suitable for many circumstances, but there
are cases where these methods become quite cumbersome. In particular when very strong and
localized density enhancements (clumps) appear, for instance due to gravity in astrophysical
problems,thefixed-gridmethodsfailtoresolveallrelevantscalesinthoseclumps. UsingAdap-
tiveMeshRefinement(AMR)onecanthenrefinethegridaroundtheseclumps,butsuchmethods
are technically very complex. A method that is particularly useful for modeling problems with
strongclumping,andyetisfairlysimpletoimplement,isthemethodofSmoothParticleHydro-
dynamics (SPH). In this method the to-be-modeled gas cloud is represented by a set of discrete
blobs of gas. These SPH particles interact with neighboring particles through a repelling force
that represents the gas pressure, but otherwise act like normal particles. The nice thing of this
method is that the computational power is automatically focused there where the mass is. So if
a clump forms, for instance due to self-gravity, the computational power is focused in this very
small region where all the mass is concentrated. It is so-to-speak an automatic AMR scheme
withouttechnical complexities. For this reason this method is often used in astrophysics, where
extremedensitygradientsare verycommon.
This chapter is based on the works by Monaghan (1992, ARA&A 30, 543) and Springel
(2005,MNRAS364, 1105).
10.1 Lagrange equations of hydrodynamics for SPH
In Smooth Particle Hydrodynamics a gas cloud of mass Mcloud is respresented by N ‘parti-
cles’, i.e. N gas subclouds of mass m = Mcloud/N. Each of these blobs moves according to
the equations of Newtonian mechanics, including a pressure force. For each of these particles
the equations are based on Lagrange form of the Euler equations (cf. Chapter 1) including the
equationofpropagation:
D ~x = ~u (10.1)
t
D ρ = ρ~ ~u (10.2)
t
− ∇·
~P
D ~u = ∇ (10.3)
t
− ρ
TD s = 0 (10.4)
t
147

## 페이지 2
148
To derive expressions for P and ~u we need to let go of the ‘particle’ picture and view the
∇ ∇·
‘particles’ instead as comoving coordinates rather than true particles. In this picture the flow is
again described on a set of grid points, but this time the grid points are irregularly spaced (not
in a mesh) and they move strictly along with the flow. If we now wish to compute numerical
derivatives,wehaveno longertheluxuryof agrid-likecoordinatesystemin whichit is obvious
whichgridpointsare neighborsofgrid pointi,j (namely i,j 1;i,j +1;i 1,j;i+1,j), but
− −
an irregularlyspaced setofneighbors.
10.2 The SPH Kernel
ThewaythispracticalproblemissolvedintheSPHmethodisbydefiningakernelW(~x ~x ′ ,h)
around every ~x ′ location of an SPH particle. This is a function that is maximum at ~x = − ~x ′ and
′ ′
falls off smoothly to zero with distance from ~x. Its value only depends on r ~x ~x . This
≡ | − |
function defines the shape of the SPH ‘blob’. The value h is the parameter which defines the
‘size’ of this blob and is called the smoothing length. The kernel is normalized to unity in the
followingway:
′ ′
W(~x ~x,h)d~x = 1 (10.5)
−
ZV
and wealsohave
′ ′
limW(~x ~x,h) = δ(~x ~x) (10.6)
h→0 − −
Again, we should not regard this ‘blob’ as a true blob of gas. In fact, SPH blobs will overlap
quite a bit, which would not be true for true balls of gas. We should regard the SPH kernel as
definingaregionofinfluenceoftheSPH particle. ItwillturnoutthatonlySPH particlesthatlie
withineach othersregionsofinfluencewillbeabletointeract witheach other.
Nowletus,forabriefmoment,dosomemathwiththefunctionW(~x ~x ′ ,h),forgettingany
reference to discrete SPH particles. Supposethat we havesome function − A(~x ′ ) defined at every
positioninspace. We can nowdefinetheconvolutionofA(~x ′ )withthekernel W(~x ~x ′ ,h):
−
A˜(~x) = A(~x ′ )W(~x ~x ′ ,h)d~x ′ (10.7)
−
ZV
InthiswaythefunctionA(vecx ′ )isblurredusingthekernelW(~x ~x ′ ,h)assomekindofpoint
spread function. Ifwenowreturnto thediscreteSPH picture, thev − aluesof~x ′ arenowthesetof
discretepositionsoftheSPH particles,and theintegralmustbereplaced by asuminsomeway.
′
Todo thiswemustfind adiscreteexpressionfortheintegrationvolumed~x. It turnsoutthatthe
way toexpressA˜(~x) is
m
A˜(~x) = A W(~x ~x ,h) (10.8)
i i
ρ −
i=1,N i
X
where ρ is the density of gas corresponding to SPH particle i, for which we will derive an
i
expression later, and A is the value of the function A corresponding to SPH particle i. Let us
i
look carefully at this expression. The ratio m/ρ gives the volume that SPH particle i takes up.
i
So if you have a situation where 100 SPH particles are spread over a large volume but another
100 SPH particles are jammed within a clump with volume much less than h 3, then the ratio
m/ρ makes sure that the 100 particles in the clump together count for only the volume they
i
occupy, which is much less than the volumeoccupied by the other 100 SPH particles. The ratio

## 페이지 3
149
m/ρ therefore makes sure that the sum over SPH particles in fact represents an integral over
i
volumeandnot overmass. Therefore, Eq. (10.8)is thediscreterepresentationofEq. (10.8).
The usefulness of Eq. (10.8) now lies in the fact that we have produced a smooth function
A ˜ (~x) from a function only known at discrete points A . It is not guaranteed that A ˜ (~x ) = A ,
i i i
but it will also not be too far from this value. Later we will replace A by the pressure P or
the density ρ so that we can use the above expressions to create a smooth pressure and density
function from the discrete one. But let us for now stick to the abstract function A. Now that we
havethissmoothfunctionwecan definethederivative:
m
A ˜ = A W(~x ~x ,h) (10.9)
i i
∇ ρ ∇ −
i=1,N i
X
where we see that the derivative operator eventually works only on the kernel. Since we know
theshapeofthekernel analytically,weknowthederivativesanalytically.
Thetwomostcommonkernelsare aGaussiankernel
1
W(r,h) = e
−r2/h2
(10.10)
h√π
and thesplinekernel 1
1 6 r 2 +6 r 3 , 0 r 1
W(r,h) = 8 − 2 h 1 r 3 , h 1 ≤ < h r ≤ 1 2 (10.11)
πh3  (cid:0) (cid:1)− h (cid:0) (cid:1) 2 h ≤
 0, r > 1
(cid:0) (cid:1) h
The Gaussian Kernel may be more natural but has the disadvantage that strictly speaking the
region of influence of each SPH particle is infinite, even though the kernel may have very low
values at large distances. The spline kernel has a very strictly defined outer edge, so that we
can a-priori ignore anything that is further away from an SPH particle than a distance of h. For
a computer implementation of the SPH method this property will save enormous amounts of
computingtime,becausethesumoverallparticlesthenreducestothesumoverallparticlesthat
haveadistancelessthan htothepoint~x .
i
Exercise: The expression for the spline kernel, Eq. (10.11), has a normalization constant
→ 8/φh 3 thatwaschosensuchthatthekernelintegratestounityin3-D.Derivethenormaliza-
tionforthecaseofSPH in1-D.
10.3 Some expressions in SPH-form
Let us write down some expressions that will be useful for later. First of all the smoothed form
ofthedensityρ˜at agivenposition~x:
ρ˜(~x) = mW(~x ~x ,h) (10.12)
i
−
i=1,N
X
Thishasthedesiredeffect thatthemoreSPH particlesarelocatedin thesamesmallregionwith
size L < h, the higher is the density. However, if the SPH particles are further away from each
1Note: ThisisthedefinitionusedbySpringel(2005,MNRAS364,1105). Monaghan(1992,ARA&A30,543)
usesaformulathatisequaltothisoneifhishisreplacedbyh/2.

## 페이지 4
150
other than h, then the SPH kernels do not overlap and the gas density around each SPH particle
simply reflects the kernel of this particle. We see here that SPH (at least with a globally fixed
valueof h) has theunfortunateproperty that it cannot modelregions ofvery lowdensity. It will
instead model such regions as being filled with localized blobs of gas separated by vacuum. A
variablesmoothinglengthh h can solvethisproble,but letus savethisforlater.
i
→
Now one may raise the question, what is the density ρ associated with each SPH particle,
i
which need not necessarily be equal to ρ˜(~x )? One way to define this is using the following
i
expression:
4π
3
h ρ
i
= Nh,i m (10.13)
3
where Nh,i is the numberof nearest neighboringparticles that happen to liewithin a radius h of
particlei.
Exercise: Arguethat bothEq. (10.12)and Eq. (10.13)producethesameresult forthecase
→
ofregularlyspaced SPH particleswithinter-spacingdistance∆x h.
≪
Nowwhat about ~u? Wehave
∇·
m
~u ˜ (~x) = i W(~x ~x ,h)u (10.14)
i i
ρ −
i=1,N i
X
So weget
m
~u ˜ (~x) = i u W(~x ~x ,h) (10.15)
i i
∇· ρ ·∇ −
i=1,N i
X
But wecan also derivean alternativeexpression. Let usfirst write
1
˜ ˜ ˜
~u = (ρ˜~u) ~u ρ˜ (10.16)
∇· ρ˜ ∇· − ·∇
h i
Wehave
(ρ˜~u ˜ ) = m u W(~x ~x ,h) (10.17)
i i i
∇· ·∇ −
i=1,N
X
ρ˜ = m W(~x ~x ,h) (10.18)
i i
∇ ∇ −
i=1,N
X
So weobtain:
ρ ( ~u ˜ ) = m (~u ~u ) W(~x ~x ,h) (10.19)
k k i i k k k i
∇· − ·∇ −
i=1,N
X
where is the derivative operator with respect to x . Now a little check: If we insert the
k k
∇
Gaussiankernel weobtain
2m
ρ ( ~u ˜ ) = i (~u ~u ) (~x ~x )W(~x ~x ,h) (10.20)
k ∇· k h2 k − i · k − i k − i
i=1,N
X
For each pair of SPH particles this expression indeed gives a positive contribution when these
particlesmoveawayfrom each other, as itshouldbe.
10.4 The SPH equations of motion
With theexpressionswe derivedabove,and with theexercisewehaveobtainedin manipulating
derivativeswithSPH, wecan nowattempttowritedownthefinal set ofSPH equations.

## 페이지 5
151
10.4.1 Momentum equation
TheSPH versionofthemomentumequation startsfrom
~˜ P
D ~u = ∇ (10.21)
t k
− ρ˜
!
k
Followingtheaboveexamples,wecan write P˜ invariousforms. Forinstance
∇
m
( P˜) = i P W(~x ~x ,h) (10.22)
k i k k i
∇ ρ ∇ −
i=1,N i
X
or
1
( P˜) = m (P P ) W(~x ~x ,h) (10.23)
k i i k k k i
∇ ρ − ∇ −
k i=1,N
X
Neitheroftheseexpressionsconserves momentum. But ifwewrite
P P P
∇ = + ρ (10.24)
ρ ∇ ρ ρ2∇
(cid:18) (cid:19)
thenwe obtain
P P
( P˜) = ρ m i + k W(~x ~x ,h) (10.25)
∇
k k i ρ2 ρ2
∇
k k
−
i
i=1,N (cid:18) i k(cid:19)
X
Themomentumequationnowbecomes
P P
D ~u = m i + k W(~x ~x ,h) (10.26)
t k
−
i ρ2 ρ2
∇
k k
−
i
i=1,N (cid:18) i k(cid:19)
X
Thishasthedesirablepropertythatitobeysthe‘actionisminusreaction’ofNewtonianmechan-
ics: the fact that momentum is conserved. To see this we write the momentum equation as a
force equation:
P P
D (m ~u ) = m m i + k W(~x ~x ,h) (10.27)
t k k k i 2 2 k k i
− ρ ρ ∇ −
i=1,N (cid:18) i k(cid:19)
X
We see for each pair of SPH particles that the gain of momentum of one is the gain of opposite
momentumoftheother, exactlyconservingmomentumas desired.
10.4.2 Energy equation
Theenergy equationcan bewrittenin theform
TD s = 0 (10.28)
t
where s istheentropy. Basically thismeans thateach SPH particlehas aspecific entropy,and it
keeps this entropy as the particle moves along. Another way of saying this is that if the density
ρ is known,thepressurefollowsfrom
i
P = K ργ (10.29)
i i i
where K is another way of writing the entropy (see Eq. 1.22 of Chapter 1). So, for each
i
SPH particle K remains constant in time. Of course, if a shock appears, then the entropy must
i
increase, which isdiscussedinSection 10.6.

## 페이지 6
152
10.4.3 Propagationequation
The next thing to do is to integratethe motionof the SPH particles, i.e. to computethe~x (t). In
i
doing so we must keep in mind that we would like elementary conserved quantities to remain
conserved as much as possible. Mass is obviously conserved, so that is no problem. Total
energy is complicated to keep globally conserved, but specific entropy is conserved for each
SPH particle. Momentum conservation requires that if two SPH particles exchange momentum
throughtheirmutualpressureforce, theonemustreceiveexactlywhat theotherloses. Asimple
firstorderintegrationschemecanbebuiltusingoperatorsplitting. Thespatialadvectionoperator
is:
x x +∆tu (10.30)
i i i
→
Thisisa driftoperator. Then wedothepressureforces:
u u +∆tf (10.31)
i i i
→
where f is the pressure force computed using the methods described above, expressed at the
i
newlocationx ′. Toget slightlybetteraccuracy oneoftendoes:
i
1
x x + ∆tu (10.32)
i i 2 i
→
u u +∆tf (10.33)
i i i
→
1
x x + ∆tu (10.34)
i i 2 i
→
This is called the leapfrog method. It has the advantage that it is very simple and it has the
benign property that it is a so-called symplectic integrator. Such an integrator is particularly
wellsuitedforequationsbasedonaHamiltonian,andconservesthePoincareintegralinvariants.
In particular for systems with gravity this is useful, for instance when integrating the orbit of
a particle around a star. This method conserves the orbital elements much better than ordinary
integratorssuchasRunge-Kutta. WerefertoSpringel(2005,MNRAS364,1105)andreferences
therein for an in-depth discussion of the leapfrog method, symplecticintegrators in general and
theirproperties.
10.5 Variable smoothing length
Asmentionedabove,oneoftheproblemsoftakingafixedsmoothinglengthforallSPHparticles
is that at low densities the gas is not well represented: it is represented by isolated blobs. There
isalsoanoppositeproblemwithaconstantsmoothinglength: inregionsofverydenseclustering
ofSPHparticles,wherehundredsorthousandsofSPHparticlesareallwithinaregionthesizeof
h,thespatialresolutioncannotbecomeanybetterthanh,andmuchcomputingpoweriswasted
onthesethousandsofparticles. Avariablesmoothinglengthisthereforeofabsolutenecessityif
problemsofhighdensitycontrast areto bemodeled.
One simple way to define the variable smoothing length of particle i is to take it such that
there are always Nh,i = Nnb nearest neighbors within a radius h
i
from that position, and where
Nnb is a constant for the simulation. This constant can be typicallytaken to be about 60, so that
ineach directionthereare roughlytwo ‘layers’ofparticleswithintheradius h .
i
With variable smoothing length one must reconsider some of the equations in which the
interactionbetweentwoSPHparticleswithpotentiallydifferentsmoothinglengthsiscomputed.

## 페이지 7
153
Forthemomentumequation Springel & Hernquist(2002, MNRAS333, 649)derivethefollow-
ingexpression:
P P
D ~u = m f i W(~x ~x ,h )+f k W(~x ~x ,h ) (10.35)
t k i i 2 k k i i k 2 k k i k
− ρ ∇ − ρ ∇ −
i=1,N (cid:18) i k (cid:19)
X
withf defined as
−1
h
f = 1+ i (10.36)
i 3ρ i∂ ∂ h ρi i !
10.6 Shocks: artificial viscosity
As mentioned above, using the energy equation in the form of Tds = 0 guarantees perfect
conservationofspecific entropyforeach SPH blob. However,ifthegasmovesthroughashock,
then physically it is clear that entropy must be generated. It is therefore clear that if we do not
include some form of artificial viscosity, such as the von Neumann-Richtmyer viscosity, then
our solutions are bound to fail miserably. The way this artificial viscosity is implemented in
Gadget-2 (seeSection 10.8)is
(D
t
~u
k
)visc = m
i
Π
ki k
W ¯ (~x
k
~x
i
) (10.37)
− ∇ −
i=1,N
X
(see Springel 2005, MNRAS 364, 1105), where Π 0 is only non-zero when particles ap-
ik
≥
proach each other. Theassociated increasein‘entropy’K is
i
1γ 1
(D
t
~u
k
)visc =
2 ργ
−
−1
m
i
Π
ki
(~u
k −
~u
i
)
∇ k
W¯ (~x
k −
~x
i
) (10.38)
i i=1,N
X
where W¯ is the arithmatic average of the two kernels. An example of a recipe for the artificial
viscosityis thatofMonaghan&Gingold(1983)and Balsara (1995):
( αc µ +βµ 2 )/ρ if~u ~x < 0
Π = − ki ki ki ki ki · ki (10.39)
ki 0 otherwise
(cid:26)
with
h ~u ~x
µ = ki ki · ki (10.40)
ki ~x 2
ki
| |
where~u = ~u ~u ,~x = ~x ~x ,andh ,ρ andc arethearithmaticmeanofh,ρresp.the
ki k i ki k i ki ki ki
− −
soundspeedofbothparticles. Typicallythevaluesofαandβ aretakentobeα 0.5 1.0and
≃ −
β = 2α.
10.7 Some thoughts about SPH
SPH is a flexible method for hydrodynamics. One can relatively easily build in various source
terms and forces such as for instancegravity. For very large simulationsit becomes a challenge
to manage the particles and to make sure that the nearest neighbors are quickly found. More-
over,tomanagegravitationalforcesoverbothshortandlongrangesrequiresrathersophisticated

## 페이지 8
154
schemes such as tree codes which organize the particles in a way that near particles are quickly
found. A nice aspect of SPH is that it is Lagrangian. One can easily include for instance chem-
istry of the gas, as long as no mixing between gas in neighboring SPH particles is required. If
that is necessary, a special recipe for mixing must be used, which is a bit more complicated.
Another nice aspect of the method is that it has no numerical bulk viscosity. But one has to
pay a price: the numerical shear viscosity can be enormous. If too few SPH particles are used,
theintrinsicclumpinessofSPH particlescauses a strongshearviscositywhichis usuallybigger
than intrinsic physical shear viscosity of the system to be modeled. The shear viscosity can be
suppressed onlyby going to very large numbers ofSPH particles, but that is numerically costly.
It is sometimes reported that SPH is intrinsically too diffusive for certain problems. Also it is
verydifficultto buildinphysicslikeradiativetransferintotheSPH method.
Allin allthemethodis veryusefulformanyproblemsofastrophysics,as longas themany
inaccuracies and potentialproblemsare keptin mind.
10.8 The code GADGET-2
There are manySPH and N-body codes in theliterature, and manycan bedownloadedfrom the
web. Acodethathasgainedparticularpopularityinrecentyearsinthecosmologicalcommunity
and elsewhere is thecode GADGET-2 by VolkerSpringel (Max-Planck-Institut fu¨rAstrophysik
in Garching, Germany). Thecode iswell documented, welltested, is easy to installand useand
itisaccompaniedbyascientificpaperdescribingthemethodologyofthecodeindetail(Springel
2005,MNRAS364,1105). Itallows,amongmanythings,forSPHgasdynamicsandatthesame
timeforN-bodydynamics,includinggravitationalinteractionsbetweenallbodies. Thecodecan
bedownloadedfrom: http://www.mpa-garching.mpg.de/gadget/.
