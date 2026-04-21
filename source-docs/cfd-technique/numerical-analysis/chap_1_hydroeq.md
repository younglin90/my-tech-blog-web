# chap_1_hydroeq

> 원본: `numerical-analysis/chap_1_hydroeq.pdf` (0.1MB, 18 페이지 추출)

## 페이지 1
Chapter 1
Equations of hydrodynamics
In this chapter we will beconcerned with compressiblegas flows. This forms themain focus of
thislecture.
1.1 Basic quantities
Thebasicquantitiesthatdescribethegasare:
Name Symbol Unit(CGS) Unit(SI)
Gas density ρ g/cm3 kg/m3
Particlenumberdensity N 1/cm3 1/m3
Velocity ~u cm/s m/s
Temperature T K K
Sound speed C cm/s m/s
s
Isothermalsoundspeed c cm/s m/s
s
Pressure P dyne/cm2 N/m2
Internal energy density E erg/cm3 J/m3
Internal specificenergy e erg/g J/kg
Internal specificenthalpy h erg/g J/kg
Total specificenergy e erg/g J/kg
tot
Total specificenthalpy h erg/g J/kg
tot
Thisisa largesetofvariables. But only3 oftheseare independent:
ρ, ~u, e (1.1)
Since the velocity ~u consists of 3 components, this means that there are in fact 5 independent
variables:
ρ, u , u , u , e (1.2)
x y z
These are the 5 quantities that we will model in the computer programs we will discuss in this
lecture. Usuallyitisunpleasantto writeu , u and u ,so wewill,fromnowon, write:
x y z
~u ≡ (u,v,w) (1.3)
whereu = u , v = u and w = u .
x y z
5

## 페이지 2
6
All other quantities are linked to the above 5 basic quantities. Most of the relations are
fundamental. Thedensityand numberdensityare related by:
ρ = Nµ (1.4)
The µ is the mean weight of the gas particles (in gram). For atomic hydrogen, for example,
µ = 1.67×10 −24 g,andforatypicalcosmicmixtureofmolecularhydrogenand atomichelium
one has roughly µ = 3.8 ×10 −24. The internal energy density is linked to the specific internal
energy:
E ≡ ρe (1.5)
Thespecificenthalpyislinkedto thespecific energy,thedensityand thepressureas:
P
h ≡ e+ (1.6)
ρ
Thetotalspecificenergy is theinternal (heat)energy plusthekineticenergy:
1
e ≡ e+ |~u| 2 (1.7)
tot
2
and thesamefortheenthalpy:
1
h ≡ h+ |~u| 2 (1.8)
tot
2
How the internal specific energy T, the adiabatic sound speed C , the isothermal sound
s
speed c , the pressure P and the internal energy E depend on each other is dependent on the
s
propertiesofthegas. Thisisdescribed by theso-called equationsof stateforthegas.
1.2 Ideal gases
In this lecture we will be mainly concerned with an ideal gas. Often this is also called a perfect
fluid. Thisisthesimplestkindofgas,andofcoursethisisanidealizationofrealgases. Nogasis
perfect. But ifdensities are lowenough and temperatures are high enough, a gastypically starts
to behave more and more as an ideal gas. For astrophysical purposes the validity of this simple
equation of state is mixed: For modeling the interiors of stars or gasous planets this equation
of state is often inadequate. But when modeling gas flows around stars or in interstellar space,
theideal gas equationof stateis very accurate! Therefore in astrophysics(with the exceptionof
stellarand planetary interiors)theidealgaslaw isalmostalwaysused.
In ideal gases the elementary particles (atoms or molecules) are considered to be freely
moving particles, moving in straight lines and once in a while colliding with another particle
and thereby changing direction. The collision events are always two-body processes, perfectly
elastic, and the particles are so small that they are many orders of magnitude smaller than the
mean-free path between two collisions. Also theparticles are assumed to haveonly interactions
witheach otherthroughlocalized collisions,so withtheexceptionofthesecollisionstheymove
alongstraightlines.
For the ideal gas law to work, and indeed for any fluid-description of a gas to work, the
mean free path between consecutive collisions must be orders of magnitude smaller than the
typicalscales at which westudyourflows. Forall oftheexampleswe shallseethisconditionis
guaranteed.

## 페이지 3
7
Theidealequationofstatelinksthetemperature,pressureandnumberdensityN ofthegas
particles:
ρkT
P = NkT ↔ P = (1.9)
µ
where k = 1.38×10 −16 erg/K is theBoltzmann constant. Anotheraspect oftheideal gasis the
equationofstaterelating thepressureto theinternal specificenergy e
P = (γ −1)ρe (1.10)
whereγ istheadiabaticindexofthegas. Innumericalhydrodynamicsthisequationforthestate
ofthegasismorerelevant,andwewillusethisonetypically,insteadofEq.(1.9). Theadiabatic
indexγ ofan idealgasis derivedfrom thenumberofdegreesoffreedom ofeach gasparticle:
f +2
γ = (1.11)
f
Incaseofanatomichydrogengaseachparticlehasmerely3degreesoffreedom: thethreetrans-
lational degrees of freedom. So for atomic gas one has γ = 5/3. For diatomic molecular gas,
such as most of the gas in the Earth’s atmosphere (mainly N and O ), as well as for molecular
2 2
hydrogengasininterstellarmolecularclouds(H )thegasparticleshave, inadditiontothethree
2
translational degrees of freedom also 2 rotational ones, yielding f = 5 and thereby γ = 7/5.
For adiabatic compression/expansion of an ideal gas with adiabatic index γ one can relate the
pressuretothedensityatall timesby
P = Kργ (1.12)
where K is a constant during the adiabatic process. The K is in some sense a form of entropy.
In fluids without viscosity, nor shocks or heating or cooling processes K remains constant for
anyfluid package. Theadiabaticsoundspeed C isbydefinition:
s
∂P P
C 2 ≡ = γ = γ(γ −1)e (1.13)
s ∂ρ ρ
Forisothermalsoundwaves (inwhich K isnotconstant,buteis), thesoundspeed is:
P
c 2 = = (γ −1)e (1.14)
s ρ
1.2.1 Mostusedvariables innumerical hydrodynamics
Ofall theabovequantitieswetypicallyuseonlyafew. Themostusedsymbolsare:
ρ, e, h, P and ~u (1.15)
1.3 The first law of thermodynamics
In compressible hydrodynamics a fluid or gas parcel undergoes many compression and decom-
pression events. When a gas parcel is compressed, its temperature tends to rise and when it is
decompressed the temperature drops. In the absense of any heat transfer to or from the parcel
weknowfromthefirst lawofthermodynamicsthat
dU = −PdV (1.16)

## 페이지 4
8
V is the volume occupied by the gas parcel, U = ρedV is the total thermal energy in the
V
volume V and P is the pressure. Eq.(1.16) is valid for adiabatic (de-)compression, i.e. (de-
R
)compression of the gas parcel without any heat exchange. With this expression we can derive
Eqs. (1.10,1.12) from the assumption that e ∝ ρα, where α is for now some arbitrary constant
which we shall constrain later. If we assume that the density in the parcel is constant and if we
definethemassoftheparcel M = ρV (whichis constant)thenwecan rewriteEq.(1.16):
P
Me dlge = M dlgρ (1.17)
ρ
yielding:
dlge
P = ρe = αρe (1.18)
dlgρ
Since e ∝ ρα, we see that P ∝ ρα+1. Since we define γ in Eq.(1.12) such that P ∝ ργ, we see
thatα = γ −1, whichmeanswe can write
P = (γ −1)ρe (1.19)
provingEq.(1.10),which istheequationofstateforapolytropicgas.
The equation of state tells us what the pressure P is, given the density ρ and the internal
heat energy e. We have seen here that upon adiabatic compression or decompression the ρ and
e are related to each other. However, the precise proportionality of the relation is fixed by the
constant K in Eq.(1.12). So, given the constant K, each density ρ has its own well-defined
thermal energy e. Two gas parcels with the sameK lie on the same adiabat. Upon compression
and decompression of a parcel the K does not change, unless heat it transferred to or from the
parcel.
The constant K is related to the entropy of the gas. The full first law of thermodynamics
reads:
dU = dQ−PdV = TdS −PdV (1.20)
where dQ is the added thermal heat to the system, and S is the entropy of the volume V which
can be expressed in terms of the specific entropy s as S = Ms. Let us consider K now to be a
variableinsteadofaconstant,andworkoutEq.(1.20). WeuseP = Kργ = (γ−1)ρe = ρkT/µ
(note: k 6= K), e = Kργ−1/(γ −1),U = Me and M = ρV andweobtain
µ 1 1
ds = dlge−dlgρ = dlgK (1.21)
k γ −1 γ −1
whereweused dlge = (γ −1)dlgρ+dlgK. Wecan thereforewrite:
k
s = s + lgK (1.22)
0
µ(γ −1)
where s is an arbitrary offset constant. This shows that the number K in Eq.(1.12) is another
0
way of writing the entropy of the gas. The entropy of a gas parcel is an important quantity.
We will see below that normal gas flow does not change the entropy of a gas parcel. Shock
fronts, however, will increase the entropy, and heating/cooling through radiative processes does
this also. Heat conduction can also do this. But these are all special conditions. Under normal
conditions a parcel of ideal gas keeps a constant entropy. This is a property that can be both
useful and problematic for the development of numerical hydrodynamic schemes, as we shall
seelater.

## 페이지 5
9
n
dS
V
Figure 1.1. Flow through a volume V with surface ∂V ≡ S. The diagram shows Gauss’s
theorem by which the change of the total content within the volume equals the integral of the
fluxthrough itssurface.
1.4 The Euler equations: the equations of motion of the gas
The motion of a gas is governed entirely by conservation laws: the conservation of matter, the
conservation of momentum and the conservation of energy. These conservation laws can be
written in the form of partial differential equations (PDEs) as well as in the form of integral
equations. Bothformswillprovetobeusefulforthenumericalmethodsoutlinedinthislecture.
1.4.1 Conservationofmass
Consider an arbitrary volume V in the space in which our gas flow takes place. Its surface we
denoteas∂V ≡ S withthe(outwardpointing)normalunitvectorateachlocationonthesurface
denoted as ~n and differential surface element as dS (Fig. 1.1). The conservation of mass says
that the variation of the mass in the volume must be entirely due to the in- or outflow of mass
through∂V:
∂
ρdV = − ρ~u·~ndS (1.23)
∂t
Z Z∂V
UsingGauss’stheorem,wecan writethisas:
∂
ρdV = − ∇·(ρ~u)dV (1.24)
∂t
Z ZV
Sincethishas tobetrueforanyvolumeV onechooses, wearriveat thefollowingPDE:
∂ ρ+∇·(ρ~u) = 0 (1.25)
t
whereρ~u isthemassflux. Thisisalso called thecontinuityequation.
Often itis usefultowritesuchequationsin tensorform(seeappendixA):
∂ ρ+∂ (ρu ) = 0 (1.26)
t i i
1.4.2 Conservationofmomentum
The momentumdensity of thegas ρ~u (which is equal to the mass flux). The total momentumin
a volume V is therefore the volume integral over ρ~u. In principle we can do the same trick as

## 페이지 6
10
above,withavolumeintegraloverρ~uandasurfaceintegraloverρ~u~u·~n. Butherewemustalso
take into account the forces that act on the surface by the gas surrounding the volume. At any
position on the surface, the force acting by the gas outside the volume onto the gas inside the
volumeis−P~n. Wecan therefore write:
∂
ρ~udV = − ρ~u~u·~ndS − P~ndS (1.27)
∂t
Z Z∂V Z∂V
Unfortunately, to use Gauss’s theorem, one must have an inner product of something with ~n at
thesurface,andP~nisnot. TosolvethisproblemweneedtointroducetheunittensorI,whichis
in index notation the Kronecker-delta (see Appendix A)1. With this we can write P~n as PI·~n.
UsingGauss’stheoremweget:
∂
ρ~udV = − ∇·(ρ~u~u+ IP)dV (1.28)
∂t
Z ZV
and arrivethusat thePDE:
∂ (ρ~u)+∇·(ρ~u~u+ IP) = 0 (1.29)
t
whichis thesameas
∂ (ρ~u)+∇·(ρ~u~u)+∇P = 0 (1.30)
t
Thequantityρ~u~u+ IP isthestresstensorofthefluid.
Again here we can put this in index notation, which is particularly practical in the momen-
tumequationas wearedealing withthestress tensorhere:
∂ (ρu )+∂ (ρu u +δ P) = 0 (1.31)
t i k i k ik
Ifweincludeavolumeforceonthegas,suchas gravity,thenwemustaddthisasasourceterm.
ForgravitytheforceisthedivergenceofthegravitationalpotentialΦ, so weobtain:
∂ (ρu )+∂ (ρu u +δ P) = −ρ∂ Φ (1.32)
t i k i k ik i
1.4.3 Conservationofenergy
Energy exists in many forms. Here we concentrate on the two most basic ones: the thermal
(internal) specific energy e and the kinetic specific energy e = u2/2. So the total energy is
kin
the volume integral of ρ(e + u2/2), and the advection of energy through the control volume
surface is the surface integral of ρ(e + u2/2)~u · ~n. But in addition to this we also have the
work that the exterior acts on the control volume according to the first law of thermodynamics
(dU = TdS − PdV), which is the surface integral of P~u·~n. So the conservation equation of
energy is:
∂ 1 1
ρ e+ u 2 dV = − ρ e+ u 2 ~u·~ndS − P~u·~ndS (1.33)
∂t 2 2
Z (cid:18) (cid:19) Z∂V (cid:18) (cid:19) Z∂V
UsingGausstheorem wethenget:
∂ 1 1
ρ e+ u 2 dV + ∇· ρe+ ρu 2 +P ~u = 0 (1.34)
∂t 2 2
Z (cid:18) (cid:19) Z (cid:20)(cid:18) (cid:19) (cid:21)
1Forthosewhoareveryfamiliarwithtensormathematics,thisisinfactthecontravariantmetric.

## 페이지 7
11
Since this must be valid for all control volumes V we get the differential form of the energy
conservationequation:
∂ (ρe )+∇·[(ρe +P)~u] = 0 (1.35)
t tot tot
orinindexnotation:
∂ (ρe )+∂ [(ρe +P)u ] = 0 (1.36)
t tot k tot k
Thisistheenergy conservationequation. Withthedefinitionofhthiscan also bewrittenas:
∂ (ρe )+∂ [ρh u ] = 0 (1.37)
t tot k tot k
1.5 Lagrange form of the hydrodynamics equations
The equations derived in Section 1.4 are the hydrodynamics equations in the form which we
shall later numerically solve. But there exists another form of these equations which is a bit
moreintuitive,and alsohassomeapplicationsinnumericalschemes. Theideaistofollowagas
element along its path and see how it changes its direction of motion and how its density and
pressure change along its way. This is called the Lagrangeform of the equations. To derivethis
form oftheequationsweneed tointroducethecomovingderivativeD as
t
D ≡ ∂ +~u·∇~ (1.38)
t t
1.5.1 Continuity equation
Withthisdefinitionthecontinuityequationthenbecomes:
D ρ = −ρ∇~ ·~u (1.39)
t
This form of the continuity equation has a physical meaning. It says that a gas parcel changes
itsdensitywhen thegasmotionconverges. In otherwords: when thegasmotionis suchthatthe
parcel gets compressed. Thiscompressionis expressedby−∇~ ·~u.
1.5.2 Momentum conservationequation
Themomentumequationcan bewrittenas
∂ ~ ρ+ρ∂ ~u+~u∇~ ·[ρ~u]+ρ~u·∇~ u+∇~ P = 0 (1.40)
t t
We now use Eq. (1.25), i.e. the continuity equation, to remove two of the terms, and with the
definitionofthecomovingderivativeweobtain
∇~P
D ~u = − (1.41)
t
ρ
This form of the equation of momentum conservation also has a physical interpretation. It says
that a gas parcel will be accelerated due to a force, which is the pressure gradient. Any other
body force, such as gravity, can be easily added as a term on the right-hand-side. This is the
advantageoftheLagrangianform oftheequations.

## 페이지 8
12
1.5.3 Energy conservationequation
Finally, the energy equation can be manipulated in a similar manner, also using Eq. (1.25) and
thedefinitionofthecomovingderivative,and weobtain
P 1
D e = − ∇~ ·~u− ~u·∇P (1.42)
t tot
ρ ρ
Nowwithe = e+|~u|2/2wecan write(inindexnotation)
tot
D e = D e+u ∂ u +u u ∂ u = D e+u (∂ u +u ∂ u ) = D e+u D u (1.43)
t tot t i t i k i k i t i t i k k i t i t i
With the momentum equation (Eq. 1.41) we can replace the part in brackets, which yields −~u·
∇~ P/ρ. Therefore weobtainfortheenergy equation:
P
D e = − ∇~ ·~u (1.44)
t
ρ
This also has physical meaning: the thermal energy of a gas parcel changes only as a result of
adiabatic compression. Recall that the first law of thermodynamics, when expressed in ρ and e,
reads
1
de = Tds−Pd (1.45)
ρ
(cid:18) (cid:19)
where s is the specific entropy. If we replace d with D , and we use the continuity equation we
t
obtain
P
D e = TD s− ∇~ ·~u (1.46)
t t
ρ
So thismeansthat anotherway ofwritingtheLagrangeformoftheenergy equationis:
TD s = 0 (1.47)
t
ortosay: theentropyofagasparceldoesnotchangealongitspathofmotion! Theequationsof
hydrodynamics, at least the simplified forms we wrote down until now, conserve entropy. After
itsjourney,afluid parcel lies onthesameadiabat as itstarted out.
Weshould,however,becarefulwiththisstatement. Itisonlytrueinregionsofsmoothflow.
As weshallseebelow,gasflows tendto formshocks,which donotconserveentropy.
1.6 Properties of the hydrodynamic equations
1.6.1 Isentropic flow
In Section 1.4.3 we have derived the energy equation for a generic gas flow. But there are
idealizedsituationwherethisequationbecomesredundant. Wehaveseen inSection 1.5.3thata
gas parcel does not change its entropy as it flows through some region. If we follow the motion
of a gas parcel, then we do not need the energy equation: we can simply remember the initial
entropy s (as represented, for instance, by the parameter K in the equation P = ργ) and at the
end of its journey we can compute the temperature and pressure immediately using this same s
(orK)thatwestarted outwith. ThisisindeedtrueforLagrangiansystems,butifweuse(as we
shalldooftenbelow)theoriginalformoftheequations(Section1.4),thenwecannotkeeptrack
of which gas parcel is which. Therefore usually the energy equation is retained in numerical
hydrodynamics.

## 페이지 9
13
However, if all of the gas in this region of interest has the same specific entropy, i.e. if the
system is isentropic,then we do not need to keep track of parcels, since all gas lies on the same
adiabatic. In that case wecan, likein theLagrangian case, drop theenergy equation and usethe
globally constant s or K to computethe pressure P from ρ whenever this is needed. This is the
advantageofisentropicflow.
1.6.2 Isothermal flow
So far we have always assumed that the gas cannot radiate away its heat, nor get heated exter-
nally by radiation. Let us here consider the other extreme: the case of extreme heating/cooling:
thesituationwherethegasisatanygiventimeimmediatelycooled/heatedtosomeambienttem-
perature. This can be true if the heating/cooling time scale of the gas is much shorter than the
dynamictimescales,whichissometimesthecaseforastrophysicalflows. Insuchacasewecan
also drop the energy equation, since we always know what e is: it is a global constant. In that
case the can always say (for ideal gases): P = (γ −1)eρ, where (γ −1)e is a global constant.
Weseethat P isthen linearlyproportionaltoρ.
Note that this linear relation between P and ρ is similar as taking γ = 1 in the polytropic
gas equation of state P = Kργ. However, for γ = 1 we have P = 0, as (γ − 1) = 0 in the
equationP = (γ−1)ρe. Somehydrodynamicistshaveinthepast,however,modeledisothermal
flows with γ = 1.01 or thereabout, so as to simulate roughly a linear relation between pressure
and density,withoutkillingtheequations.
1.6.3 Pressureless flow
Virtually all the properties and peculiarities of the motion of gases arises because of the effect
thatthepressureP has. Ifweweretoassumethatthepressureissmall,whatwouldthenhappen?
Firstofall,weneedtodefinewhatissmall. Thepressureappearsasasecondtermnexttoρu u
i k
in the momentum equation. So if P ≪ ρ|~u|2 we can reasonably safely assume P ≃ 0. The
momentumconservationequationthen becomes
∂ (ρu )+∂ (ρu u ) = 0 (1.48)
t i k i k
The continuity equation remains unchanged. The energy equation becomes irrelevant because
e ≃ 0. So the continuityequation togetherwith Eq. (1.48)form the equationsfor a pressureless
gas. It is more precise to say: for a extremely supersonicgas as no gas is perfectly pressureless.
Wewilllater examinethepropertiesofBurger’s equations(Section 2.13)whichare mathemati-
cally equivalenttotheseequations.
1.7 Sound waves
As we will show rigorously lateron, the dynamics of inviscid fluids, as described by the Euler
equations,isinfactpurelyamatterofthepropagationofsignals. Therearetwokindsofsignals:
soundwavesandfluidmovements. Onecandescribetheentiredynamicsofthefluidintermsof
thesekindsofsignals. For1-D fluidsonecan makediagramsofthesesignalsinthe(x,t)plane,
and the signals propagate along lines called characteristics. In this section we will derive the
propagationofsoundwavesinastaticandinamovinggaswithconstant(background-)density,
and we will therewith demonstrate the concept of characteristics. Since this example is for
infinitesimal perturbations on a constant density medium, it will only give an impression of the
principle, but it will be very important for what follows. In fact, the entire applied mathematics

## 페이지 10
14
of numerical hydrodynamicsis based on these concepts, and they therefore stand at the basis of
thislecture.
1.7.1 Derivationofwaveequation
Consider a constant density medium with a small space- and time-dependent perturbation. Let
usrestrict ourselvesto1-D. Thedensityis then
ρ(x,t) = ρ +ρ (x,t) (1.49)
0 1
withρ ≪ ρ . Thefluid isassumedto movewithaspeed u(x,t)which isgivenby
1 0
u(x,t) = u +u (x,t) (1.50)
0 1
Theequationsofmotionin1-D are:
∂ ρ+∂ (ρu) = 0 (1.51)
t x
∂ (ρu)+∂ (ρu 2 +P) = 0 (1.52)
t x
WithP = Kργ thesecond equationbecomes
P
∂ (ρu)+∂ (ρu 2 )+γ ∂ ρ = 0 (1.53)
t x x
ρ
WithEqs.(1.49,1.50)weget to firstorder intheperturbations:
∂ ρ +ρ ∂ u +u ∂ ρ = 0 (1.54)
t 1 0 x 1 0 x 1
P
u ∂ ρ +ρ ∂ u +2ρ u ∂ u +u 2 ∂ ρ +γ 0 ∂ ρ = 0 (1.55)
0 t 1 0 t 1 0 0 x 1 0 x 1 x 1
ρ
0
Ifweinsert Eq.(1.54)intoEq.(1.55)thenweget:
∂ ρ +ρ ∂ u +u ∂ ρ = 0 (1.56)
t 1 0 x 1 0 x 1
P
0
ρ ∂ u +ρ u ∂ u +γ ∂ ρ = 0 (1.57)
0 t 1 0 0 x 1 x 1
ρ
0
If, justfornow,wesetu = 0 (staticbackgrounddensity),thenweobtain:
0
∂ ρ +ρ ∂ u = 0 (1.58)
t 1 0 x 1
P
0
ρ ∂ u +γ ∂ ρ = 0 (1.59)
0 t 1 x 1
ρ
0
Thesetwoequationscan becombinedto
P
∂ 2 ρ −γ 0 ∂ 2 ρ = 0 (1.60)
t 1 ρ x 1
0
This is a wave equation with waves travelling at velocity + γP /ρ and − γP /ρ . Hence
0 0 0 0
thedefinitionofC2 = γP/ρinSection 1.2.
s p p
Now let us go back to the full equations with u 6= 0. Let us define a comoving derivative
0
D ofsomefunctionq(x,t) as:
t
D q(x,t) ≡ ∂ q(x,t)+u ∂ q(x,t) (1.61)
t t 0 x

## 페이지 11
15
time
space
Figure 1.2. The movement of the signal of a perturbation imposed at some point x and time
0
t ina1-Dspacetime, forthecaseofzerobackground velocity, i.e.u = 0.
0 0
Withthisdefinitionwecan writeEqs.(1.56,1.56)as:
D ρ +ρ ∂ u = 0 (1.62)
t 1 0 x 1
P
0
ρ D u +γ ∂ ρ = 0 (1.63)
0 t 1 x 1
ρ
0
As before, thesetwo equationscan becombinedto
P
D 2 ρ −γ 0 ∂ 2 ρ = 0 (1.64)
t 1 ρ x 1
0
Thiscanbeinterpretedasawaveequationinthecomovingframeofthebackgroundmedium. So
thetwowavespropagatewithvelocitiesu + γP /ρ and u − γP /ρ .
0 0 0 0 0 0
Thesolutionis:
p p
ρ (x,t) =
Aeikx−iωt
(1.65)
1
A P
u (x,t) = γ
0 eikx−iωt
(1.66)
1
ρ 0s ρ 0
withthedispersionrelation
ω P
0
= u ± γ (1.67)
0
k s ρ 0
1.7.2 Characteristics
The fact that linear perturbations move as waves can be depicted in the (x,t) plane. Consider
a sudden point-like perturbation at some place x at time t . For t < t there were no pertur-
0 0 0
bations, and at time t this point-like perturbation is initiated. What will happen? One wave
0
will propagateto theleft at velocityu − γP /ρ , and onewave willpropagateto theright at
0 0 0
velocity u + γP /ρ . Of course, if u > γP /ρ then the leftward moving wave is also
0 0 0 0p 0 0
movingtotherightas itis draggedalong. In thiscase thebackgroundvelocityu issupersonic.
0
p p
In any case, we can plot the exact location of the perturbation at any time t > t in the (x,t)
0
diagram(Fig. 1.2).
One sees that this forms a wedge and, dependent on u , this wedge is slanted or not. In
0
case of supersonic background flow the wedge tops over. The lines shown in these diagrams

## 페이지 12
16
time c− c
0
c
+
space
Figure 1.3. The three characteristics c−,c
0
,c
+
of the hydrodynamics equations in 1-D, be-
longing tothecharacteristic velocities λ−1 ,λ
0
,λ
+1
.
are called characteristics. They do not necessarily have to be defined as belonging to the origin
(x ,t ). Any line in the (x,t) diagram following the possible trajectory of a signal is called a
0 0
characteristic. In thiscasewehaveplottedthesound-characteristics.
Thereisalsoanothersetofcharacteristics. Thisisnotseenintheaboveanalysis. However,
itcanbeshownifwegivethefluida‘color’. Supposethatatt = t wedyeallgasleftofx blue
0 0
andallgasrightofx asred. Wenowintroduceaspecialfunctionϕ(x,t)whichgivesthecolor.
0
Ifit is0, itmeansblue, if1 itmeans red. Theequationofthispassivetraceris:
∂ ϕ+u∂ ϕ = 0 (1.68)
t x
Wenowinsertu = u +u :
0 1
∂ ϕ+u ∂ ϕ+u ∂ ϕ = 0 (1.69)
t 0 x 1 x
We immediately see that the last term is negligible compared to the first two, so we obtain
approximately:
∂ ϕ+u ∂ ϕ = 0 (1.70)
t 0 x
This signal evidently propagates with velocity u . This gives the third set of characteristics, de-
0
scribingthemovementofthefluiditself. Thisshowsthatintotalwehave,forthis1-Dexample,
threesetsofcharacteristics, movingat speeds:
λ−1 = u
0
− γP
0
/ρ
0
(1.71)
λ = u (1.72)
0 0 p
λ = u + γP /ρ (1.73)
+1 0 0 0
p
Thisexampleshowsthat,atleastforlinearperturbationsofanotherwisesteadyconstant-density
background,thehydrodynamicsequationsamounttothepropagationofsignalsatthreedifferent
speeds. Two signals are sound signals, while a third signal is the movement of mass (Fig. 1.3).
Thisthirdsignalmaysoundabitas acheat, sinceitissimplythepassiveco-movementwiththe
background fluid, and has no dynamical character of its own as the sound waves do. However,
in the non-linear evolution of hydrodynamic flows this third characteristic plays an essential
role and is no longer a passive tracer. We will see this later, when we view the hydrodynamics
equationsas ahyperbolicset ofequations.

## 페이지 13
17
1.8 Viscosity
1.8.1 Bulk andshear viscosity
So far we have assumed that the only force on a fluid parcel is the force due to a pressure
gradient. Therearealsootherforcesthatcanbeinvolvedintheexchangeofmomentumbetween
fluid parcels. Here we focus on the force of viscosity. A force between to adjacent fluid parcels
A andBcan beseen as afluxofmomentumfromfluid parcel Ato B, orthereverseflux from B
toA. Let usrecall Eq.(1.31)andwriteitin aspecial way:
∂ (ρu )+∂ (ρu u +δ P) = 0 (1.74)
t i k i k ik
= ∂ (ρu )+∂ (ρu u +Π ) = 0 (1.75)
t i k i k ki
= ∂ (ρu )+∂ T = 0 (1.76)
t i k ki
whereT isthemomentumfluxdensitytensorandΠ thepressuretensor2. TheT tensoristhe
ki ki ki
flux of i momentumin k direction. It is thespatial part ofthestress-energy tensorfamiliarfrom
relativitytheory(Tµν = ρuµuν +gµνP,forthosewhoarefamiliarwithit). BothT andΠ are
ki ki
always asymmetrictensor, i.e.it couldalsodescribetheflux ofk momentumin idirection. For
the particular case at hand, where Π represents merely the pressure force, this tensor has two
ki
twospecial properties:
1. Momentum is exchanged only in the direction where the transported momentum points.
In other words: Π is a diagonal tensor. X-momentum is transported in X-direction, Y-
ki
momentuminY-directionetc.
2. Theforces arealwaysperfectly ‘elastic’inthesensethattheforcedoesnotdepend onthe
speed of compression or decompression of a fluid element. These (de-)compressions are
thereforereversibleprocesses.
If we have viscosity, then these properties do no longer hold. Viscosity is a force that acts
whenever there are velocity gradients in the flow, or to be precise, whenever there is shear flow.
In thepresenceofviscosity,Π reads:
ki
′
Π = δ P −σ (1.77)
ki ki ki
whereσ ′ is theviscousstresstensor:
ki
2
′
σ = η ∂ u +∂ u − δ ∂ u +ζδ ∂ u (1.78)
ki i k k i 3 ki l l ki l l
(cid:18) (cid:19)
where η is the coefficient of shear viscosity and ζ is the coefficient of bulk viscosity. These
are also called the coefficient of viscosity and the second viscosity respectively. The kinematic
viscositycoefficient ν is defined as
ν = η/ρ (1.79)
Theequationsofmotionarethen:
′
∂ (ρu )+∂ (ρu u +δ P −σ ) = 0 (1.80)
t i k i k ik ik
or, inLagrangeform:
′
ρD u = −∂ P +∂ σ (1.81)
t i i k ki
2HerewedeviatefromtheLandau&Liftshitznotation.

## 페이지 14
18
Thisequationiscalled theNavier-Stokes equation.
To understand what these equationsmean we can do two experiments,which we do in 3-D
Cartesian coordinates(x,y,z):
1. Take a velocity field u = (y,0,0). This is a typical shear flow without compression. We
i
obtain:
0 η 0
′
σ = η 0 0 (1.82)
ki  
0 0 0
ki
 
When inserting this into Eq. (1.81) we see that this transports negative x−momentum in
positivey-direction. Thisiswhat wearefamiliarwith asfriction.
2. Takeavelocityfieldu = (−x,0,0). Thisisatypicalcompressiveflowwithoutshear. We
i
obtain:
−ζ 0 0
′
σ = 0 0−ζ 0 (1.83)
ki  
0 0 −ζ
ki
 
When inserting this into Eq. (1.81) we see that this transports positive x−momentum in
positive x-direction. But if we would flip the sign of u (i.e. have decompression), then
i
we have the force also flip sign: we it will transports negative x−momentum in positive
x-direction. In otherwords: bulk viscosityacts againstboth compressionand decompres-
sion. Or we can say: whatever one does (compression or decompression), it always costs
energy. This iswhatbulk visocitydoes.
→ Exercise: Show that the viscous force vanishes for solid-body rotation, and explain why
thismustbeso.
→ Exercise: Assume a constant density flow with a velocity field of u = (sin(y),0) at time
i
t = 0. Computethe∂ u at timet = 0.
t i
1.8.2 Howimportant isviscosity?
Some flows are very little affected by viscosity, for instance the flow of air around obstacles, or
the flow of water through a river. Other flows are very much affected by viscosity, for instance
the flow of sirup or Nutella that one smears on bread, or the flow of a glacier. A quantity to tell
thedifferenceistheReynoldsnumber:
ρuL uL inertialforces
Re = = = (1.84)
η ν viscousforces
where u is the typical velocity in the fluid flow and L is a typical spatial scale corresponding
to the size of the fluid patterns we are interested in. One sees that the Reynolds number is not
a very strictly defined quantity, because u may vary in the flow and L is just a ‘typical’ length
scale. But itdoes an indicationoftheimportanceofviscosityintheflow:
Re >> 1 → Very inviscidflows. Theseflows can ofteneasily becometurbulent.
Re << 1 → Very viscousflows. Theseflowstendto beverylaminar.
Wewillseein laterchapters that:

## 페이지 15
19
1. High Re flows are difficult to model numerically because the numerical algorithm artifi-
ciallylowersRe(‘numerical viscosity’)
2. High Re flows often become turbulent (though not always). The flow patters in turbulent
flowshavearangeofscalesL,goingfromthelargerstturbulenteddies,downtoverysmall
scales. This is called a turbulent cascade. The smallest scale of turbulence is the scale L
where Re = uL/ν starts to exceed unity. Therefore, the Reynolds number of turbulent
flowsis alwaysamatterofdefinitionwhich Lto use.
3. Turbulencecan acts as an ‘effectiveviscosity’in itself.
4. Even laminar flows of high Re are sometimes affected by viscosity through boundary
layers: thin layers between a high-Re flow and some solid surface with a thickness such
thatin thislayer Re & 1.
1.9 Shock waves
Under normal conditions the equations of hydrodynamics ensure that a fluid parcel keeps its
entropy constant, as we have seen in Section 1.5.3. However, even in the case of inviscid fluids
(Re → ∞) there are conditions under which this no longer true: when a shock wave occurs.
The formation of a shock wave can be understood in various ways. One way is to consider a
very strong sound wave. At the top of the wave the temperature is higher than at the valley of
the wave. Since the sound speed is proportional to the square root of the temperature, it is to
be expected that the top of the wave moves faster than the valley. The wave therefore has the
tendency to steepen like waves on the beach. This will necessarily lead to the formation of a
discontinuity called a shock wave. One sees that formally even normal sound waves eventually
developshockwaves. Thesewill,however,bevery veryweak ones,and theybehavevery much
like a normal sound wave. In other words: a very weak shock wave is like a sound wave. The
shock wave emerging from an explosion will, as it spherically expands, weaken in strength and
eventuallybe a strong jump-likesound wave. Also the shock wave emerging from a supersonic
airplaneeventuallyisheard by peopleon thegroundas a‘sonicboom’,i.e. asoundwave.
We will deal with shock waves in chapter ?? in much more detail than here. But some of
thebasicsarenecessaryatthispoint. Thenatureofashockwaveisgivenbyitsjumpconditions.
It givewhich statethegasisin aftergoingthroughashockwave.
Letusassumethatwemovealongwiththeshock,sothatinourlaboratoryframetheshock
is standing still and the gas (before and after the shock) is moving. We assume a steady state in
thisframeandwedefineρ andρ (andidemditoforallothervariables)suchthatthegasmoves
1 2
from region 1 to region 2. This means that mass flux, momentum flux and energy flux through
theshockmustbeconstant:
ρ u = ρ u (1.85)
2 2 1 1
ρ u 2 +P = ρ u 2 +P (1.86)
2 2 2 1 1 1
ρ h u = ρ h u (1.87)
2 tot 2 1 tot 1
Now let us define the specific volumes V = 1/ρ and V = 1/ρ and the mass flux j = ρ u =
2 2 1 1 2 2
ρ u . We thenget
1 1
u = jV u = jV (1.88)
2 2 1 1

## 페이지 16
20
and
P +j 2 V = P +j 2 V (1.89)
2 2 1 1
whichyields
j 2 = (P −P )/(V −V ) (1.90)
1 2 2 1
In principle this equation allows for two solutions, one in which the post-shock medium has a
higherpressurethanthepre-shockmedium(P > P ),andoneinwhichthepost-shockmedium
2 1
has a lower pressure than the pre-shock medium (P < P ). The latter will turn out to be an
2 1
unphysical solution. In pracise such a solution will quickly smear out into a rarefaction wave,
but this topicwill bediscussed in chapter ??. We focus here on the case P > P which is what
2 1
wecall ashockwave.
Wenowsubstituteu −u = j(V −V ) intoEq.(1.90)and obtain
2 1 2 1
u −u = (P −P )(V −V ) (1.91)
1 2 2 1 1 2
p
where we took only the positive root because that is the physical one. Now let us turn to the
energy equation
ρ (h + 1u 2 )u = ρ (h + 1u 2 )u (1.92)
2 2 2 2 2 1 1 2 1 1
Because ofmassconservationthisturnsinto
h + 1u 2 = h + 1u 2 (1.93)
2 2 2 1 2 1
and furtherinto
h −h = 1j 2 (V 2 −V 2 ) (1.94)
2 1 2 1 2
and withEq.(1.90)into
h −h = 1(V +V )(P −P ) (1.95)
2 1 2 1 2 2 1
Nowreplace h = e+PV and weobtain
e −e = 1(V −V )(P +P ) (1.96)
2 1 2 1 2 2 1
This is the relation between the state of the gas before and after the shock. It is called the
Rankine-Hugoniotshockadiabatic.
Forpolytropicgases wecan derivethefollowingexpressions(see e.g. Landau& Lifshitz):
ρ u (γ +1)M2
2 = 1 = 1 (1.97)
ρ u (γ −1)M2 +2
1 2 1
P 2γM2 γ −1
2 = 1 − (1.98)
P γ +1 γ +1
1
2+(γ −1)M2
M 2 = 1 (1.99)
2 2γM2 −(γ −1)
1
where M ≡ |u |/C and M ≡ |u |/C are the Mach numbers on the pre- and post-shock
1 1 s 2 2 s
regions.
Somepropertiesofshocks:
• For mono-atomic gas (γ = 5/3) the maximum compression of the gas (for M → ∞) is
1
ρ /ρ → 4,and fordiatomicgas(γ = 7/5)itisρ /ρ → 6.
2 1 2 1

## 페이지 17
21
• The Mach number before the shock is always M > 1 and the Mach number behind the
1
shock isalways M < 1.
2
• When a gas parcel goes through a shock, its entropy is increased. For the integral form of
thehydrodynamicsequationswithoutviscosity,shocksaretheonlyregionsinspace where
gasparcels increasetheirentropy.

## 페이지 18
22
