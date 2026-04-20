# chap_8_coord_grid

> 원본: `numerical-analysis/chap_8_coord_grid.pdf` (0.1MB, 11 페이지 추출)

## 페이지 1
Chapter 8
Coordinate systems and gridding
techniques
So far we have assumed that we are doing modeling in a cartesian coordinate system with a
rectangular mesh. For many applications this is, however, too restrictive. For instance, in as-
trophysics, if we are interested in modeling the hydrodynamics of a rotating star or a rotating
collapsing molecular cloud core, then we know (or assume) beforehand that our solution will
be nearly spherical, and that we are modeling deviations from such a spherical distribution. It
is then clear that a polar coordinate system (r,θ,φ) (often also called a “spherical coordinate
system”) is better and easier to use. Another example is if we wish to study axisymmetric sys-
tems. In this case we can restrict ourselves to two dimensions: (r,θ) in polar coordinates or
(r,z) in cylindricalcoordinates. Since2-D calculationsareverymuch fasterthan3-D ones,this
choice of coordinates saves a lot of computingtime for such problems. Therefore non-cartesian
coordinatesare veryoften used,in particularin astrophysics.
But sometimes the useage of a different coordinate system does not help. For instance,
in astrophysics, if we want to model the collapse of a complex and clumpy molecular cloud,
in which a number of clumps contract enormously and eventually become stars. No choice of
coordinatesystemhelps here. Onemust refine thegrid around each clump in an adaptive(time-
dependent) way. For this type of gridding problem astrophysicists typically use Adaptive Mesh
Refinement (AMR).
Amoredown-to-earthexampleistheflowofgasorfluidaroundobstacles,suchastheflow
ofairaroundawingoraroundaracingcar. Theshapeoftheobstacleistypicallytoocomplexto
warp aparticularcoordinatesystemaroundit. Ontheotherhand, ifwetrytosolvethisproblem
on a cartesian grid, then the obstacle surfaces are jagged surfaces (like a slope of a hill created
with LEGO blocks). These jagged surfaces tend to produce disturbances that, in high Reynolds
numberflows,canreallycausehavocinthesolution. Inthesecasesspecialpurposeunstructured
gridsareused.
In thischapterwewilltouchuponallthreeissues(thepolarcoordinatesystem,AMRtech-
niques and unstructured grids), but we willbe rather brief. We willconcern ourselves only with
Riemann solvers, but much of the philosophy can be directly transferred to classical hydrody-
namicsschemes aswell.
NOTE: This chapter is written very recently, so there may still be errors in the equations.
Beware.
123

## 페이지 2
124
8.1 Hydrodynamics in the polar coordinate system
8.1.1 A scalarconservationlaw inpolarcoordinates
There are two popular non-cartesian coordinate systems that are often used: cylindrical coordi-
nates(r,φ,z) andpolar/sphericalcoordinates(r,θ,φ). Inthissectionwewillfocusonthepolar
coordinatesystem. Theequationsforcylindricalcoordinatescanbederivedfromthesebytaking
z ≃ (π/2−θ)r and taking the limit z ≪ r to remove all sine and cosine factors (and once the
equationsarederived,z can againbelarge).
The coordinates are: r > 0, the radial coordinate, 0 ≤ θ < π the polar coordinate (θ = 0
is the north pole, θ = π is the south pole and θ = π/2 is the equatorial plane), and 0 ≤ φ < 2π
theazimuthalcoordinate. Letusdefine~uthevelocityvectorand(u,v,w)itscomponentsinr,θ
and φdirections.
Each grid point (r i ,θ j ,φ k ) is at the center of a cell. A cell is given by: r i−1/2 ≤ r <
r i+1/2 , θ j−1/2 ≤ θ < θ j+1/2 , φ k−1/2 ≤ φ < φ k+1/2 . The cell walls in r and θ direction are
curved while the cell walls in φ direction are straight surfaces. This curvature will turn out to
produce new terms in the momentum equations, but let us first look at how we can formulate a
scalar conservation problem in polar coordinates. The partial differential equation for a scalar
conservationlawinpolarcoordinatesis:
∂q ∂q 1 ∂(r2qu) 1 ∂(sinθ qv) 1 ∂(qw)
+∇·(q~u) = 0 = + + + = 0 (8.1)
∂t ∂t r2 ∂r rsinθ ∂θ rsinθ ∂φ
As onecan see, therearevariousgeometricfactors involved.
One can easily see how these factors arise if one derives a discrete version of this conser-
vation equation. Consider a cell (i,j,k) given by r i−1/2 ≤ r < r i+1/2 , θ j−1/2 ≤ θ < θ j+1/2 and
φ k−1/2 ≤ φ < φ k+1/2 . Thevolumeofthiscell is:
1
V i,j,k = 3 (r i 3 +1/2 −r i 3 −1/2 )(cosθ j−1/2 −cosθ j+1/2 )(φ k+1/2 −φ k−1/2 ) (8.2)
Thei+1/2surface ofthecellin r-direction(i.e.an r =constantsurface)is:
S (r),i+1/2,j,k = r i 2 +1/2 (cosθ j−1/2 −cosθ j+1/2 )(φ k+1/2 −φ k−1/2 ) (8.3)
andsimilarfori−1/2. Thej+1/2surfaceofthecellinθ-direction(i.e.aθ =constantsurface)
is:
1
S (θ),i,j+1/2,k = 2 (r i 2 +1/2 −r i 2 −1/2 )sinθ j+1/2 (φ k+1/2 −φ k−1/2 ) (8.4)
andsimilarforj−1/2. Thek+1/2surfaceofthecellinφ-direction(i.e.aφ =constantsurface)
is:
1
S (φ),i,j,k+1/2 = 2 (r i 2 +1/2 −r i 2 −1/2 )(θ j+1/2 −θ j−1/2 ) (8.5)
and identicalfork −1/2.
Ifwenowdifference theequationsina conservativeform:
∂(q V )
i,j,k i,j,k = F i−1/2,j,k S (r),i−1/2,j,k −F i+1/2,j,k S (r),i+1/2,j,k
∂t
(8.6)
+F i,j−1/2,k S (θ),i,j−1/2,k −F i,j+1/2,k S (θ),i,j+1/2,k
+F i,j,k−1/2 S (φ),i,j,k−1/2 −F i,j,k+1/2 S (φ),i,j,k+1/2

## 페이지 3
125
where F is the flux for q. Eq.(8.6) is the conservativelydiscretized form of the scalar conserva-
tionequationinageneralcoordinatesystem. WithEqs.(??)insertedintoEq.(8.6),weobtainthe
conservativelydiscretized form ofthescalarconservationequationinpolarcoordinates.
For uselater in thischapter, let us introduce∆ , ∆ , and ∆ , as well as S , S and S , and
r θ φ r θ φ
finally F ,F andF such thatEq. (8.6)forpolarcoordinates can bewrittenas:
r θ φ
∂(q V )
i,j,k i,j,k +(∆ F S ) +(∆ F S ) +(∆ F S ) = 0 (8.7)
r r r i,j,k θ θ θ i,j,k φ φ φ i,j,k
∂t
Herethe∆ symboldenotesthatadifferenceiscomputedoftheargument(here: F S )between
r r r
itsvalueat thei+1/2interface and thei−1/2interface. Sameforθ and φ.
→ Exercise: Derive,fromthisdiscreteformoftheconservationequation,thedifferentialform
oftheequation,Eq.(8.1).
8.1.2 The Euler equations inpolarcoordinates
ThediscretizedconservationlawintheformEq.(8.6)(orequivalentlyEq.(8.7))istheformofthe
equation which we use for our Riemann solvers for hydrodynamics. Because Riemann solvers
by definition produce an interface flux (F , F or F ), this form of the con-
i+1/2,j,k i,j+1/2,k i,j,k+1/2
servation equation lends itself perfectly for Riemann solvers. One simply substitutes the scalar
q with (ρe ,ρu,ρv,ρw,ρ) and the scalar fluxes F , F and F with
i,j,k tot i,j,k i+1/2,j,k i,j+1/2,k i,j,k+1/2
thefluxesfromtheRiemannproblemsineachofthesedirections. Thisisindeedthewaywecan
implementRiemannsolversinnon-cartesian coordiantes. However,thisisunfortunatelynotyet
thefullstory.
The above derivation only holds for scalar quantities. Indeed, ρ and ρe are scalars, and
tot
bothobeyEq. (8.1):
∂ρ
+∇·(ρ~u) = 0
∂t
(8.8)
∂ρ 1 ∂(r2ρu) 1 ∂(sinθ ρv) 1 ∂(ρw)
= + + + = 0
∂t r2 ∂r rsinθ ∂θ rsinθ ∂φ
and
∂ρe
tot +∇·(ρh ~u) = 0
tot
∂t
(8.9)
∂ρe 1 ∂(r2ρh u) 1 ∂(sinθ ρh v) 1 ∂(ρh w)
tot tot tot tot
= + + + = 0
∂t r2 ∂r rsinθ ∂θ rsinθ ∂φ
Boththeseequationscanindeedbesolvedusingthediscreteformwederivedabove(seeEq.8.6).
Thesegiveforthedensityequation:
∂(ρV)
i,j,k +(∆ F S ) +(∆ F S ) +(∆ F S ) = 0 (8.10)
r ρr r i,j,k θ ρθ θ i,j,k φ ρφ φ i,j,k
∂t
whereF ,F andF aretheRiemannfluxes forthedensity. Fortheenergy equation:
ρr ρθ ρφ
∂(ρe V)
tot i,j,k +(∆ F S ) +(∆ F S ) +(∆ F S ) = 0 (8.11)
∂t
r ρetotr r i,j,k θ ρetotθ θ i,j,k φ ρetotφ φ i,j,k
whereF , F and F aretheRiemannfluxes fortheenergy.
ρetotr ρetotθ ρetotφ

## 페이지 4
126
However, for the momentum components ρu, ρv and ρw this is not the case. These three
formther,θandφcomponentsofthemomentumvector~p,whichissensitivetospatialdirection.
Now here comes the difficulty: Suppose one has a momentum vector p~ = (1,0,0) at location
1
(r = 1,θ = π/2,φ = 0). If we compare this to the momentum vector p~ = (1,0,0) at location
2
(r = 1,θ = π/2,φ = π/2), then we see that these two vectors, although they have precisely
the same components in polar coordinates, they point in different directions. This is because
the vector basis in which the vector components are formulated in the polar coordinates is a
local vector basis: the first component always points away from the center, the second away
from the pole and the third in the azimuthal direction. These directions are different at different
positions. Since physical objects, like fluid/gas packages, do not have knowledge of the polar
coordinate system and its peculiarities, their momentum vectors behave “naturally” when they
are expressed in a global vector basis. If they are cast into a local basis that has a different
orientation at different positions,then they behave strangely in such a basis. Therefore, in polar
coordinates the conservation laws of vector quantities such as the momentum of a fluid parcel
yields extra terms in the equations. They look as if an additional force is present, and therefore
these terms are also called “pseudo forces”. They have the property that they only change the
directionofthemomentumvectorasexpressedinthelocalbasisofthenon-cartesiancoordinate
system. The absolute value of the momentum vector (and thereby of the velocity vector) is not
changed. This is logical, because pseudo forces are not real forces and can therefore not truly
accelerate or decellerate a fluid parcel. However, in Section 8.1.5 we will see that if one uses a
rotatingpolarcoordinatesystem,thenitmayseemasifatrueacceleration/decellerationistaking
place, butagain,thisturn outtobenota real effect.
It is not trivial to derive the extra terms that arise for the momentum equations. The most
robust and reliable way of doing this is to use Riemannian Geometry, and this method also
allowsonetoderivetheequationsofviscoushydrodynamics(theNavier-Stokesequation),which
spawns even more complex additional terms when cast in polar coordinates. We will not go
into this mess here, and instead we will simply quote the resulting Euler equations in polar
coordinates.
Theradial momentumequationbecomes:
∂ρu 1 ∂(r2ρu2) ∂P 1 ∂(sinθρuv) 1 ∂(ρuw)
+ + + +
∂t r2 ∂r ∂r rsinθ ∂θ rsinθ ∂φ
(8.12)
ρ(v2 +w2)
− = 0
r
In discreteformfortheRiemann solver:
∂(ρuV)
+∆ (F S )+∆ (F S )+∆ (F S )
r rr r θ rθ θ φ rφ φ
∂t
(8.13)
2P ρ(v2 +w2)
= + V
(cid:20) r r (cid:21)
where V is the volume of the cell, S , S and S the surfaces of the cell, and F = ρu2 + P,
r θ φ rr
F = ρuv and F = ρuw the momentum fluxes for this equation. These momentum fluxes
rθ rφ
(togetherwiththedensityandenergyfluxes)aretheonesthatweobtainfromtheRiemannsolver
ofourchoiceattheinterfaces.

## 페이지 5
127
Theθ momentumequationbecomes:
∂ρv 1 ∂(r2ρuv) 1 ∂(sinθρv2) 1∂P 1 ∂(ρwv)
+ + + +
∂t r2 ∂r rsinθ ∂θ r ∂θ rsinθ ∂φ
(8.14)
vu cosθ w2
+ρ − ρ = 0
r sinθ r
In discreteformfortheRiemann solver:
∂(ρvV)
+∆ (F S )+∆ (F S )+∆ (F S )
r θr r θ θθ θ φ θφ φ
∂t
(8.15)
vu cosθρw2 +P
= − ρ − V
(cid:20) r sinθ r (cid:21)
whereF = ρvu, F = ρv2 +P and F = ρvw arethemomentumfluxesforthisequation.
θr θθ θφ
Theφ momentumequationbecomes:
∂ρw 1 ∂(r2ρuw) 1 ∂(sinθρvw) 1 ∂(ρw2 +P)
+ + +
∂t r2 ∂r rsinθ ∂θ rsinθ ∂φ
(8.16)
ρuw cosθρvw
+ + = 0
r sinθ r
In discreteformfortheRiemann solver:
∂(ρv V)
φ
+∆ (F S )+∆ (F S )+∆ (F S )
r φr r θ φθ θ φ φφ φ
∂t
(8.17)
uw cosθρvw
= − ρ + V
(cid:20) r sinθ r (cid:21)
whereF = ρwu,F = ρwv and F = ρw2 +P are themomentumfluxes forthisequation.
φr φθ φφ
TherecipeforapplyingaRiemann solvertopolarcoordinatesisthen:
• At the start of the run we pre-compute the cell volumes and cell surfaces, as well as the
necessarycosineandsinevalues. ThissavesmuchCPUtime,inparticularsincecosineand
sinefunctionsare heavy intermsofCPU timerequired.
• We perform directional operator splitting (Strang splitting). For each direction we do 1-D
independentproblemsand copytheirresultsback intothe3-D grid.
• Foreach 1-Dproblemwecomputetheleft-and right-interfacestatesinpreciselythesame
way as the chapter on Riemann solvers. These left and right states are now used to com-
pute the Riemann interface fluxes. Note that the Roe or HLLC subroutine used here does
not know about any geometric issues. It simply produces a flux as if it were a Cartesian
Riemann solver.
• These Riemann fluxes are now inserted in the r, θ or φ splitted part of Eqs.(??). By virtue
ofoperatorsplittingtheothertermsin theseequationsare puttozero.
• Thesourcetermsintheseequationscanbeaddedattheveryendofthetimestep,asanother
operatorsplittingstep. Butsometimesitcanbeusefulinsteadtoaddoneofthemattheend
of one directional splitting step, while the other at the end of another directional splitting
step. This is something the designer of the algorithm can choose freely. Various choices
have various special advantages and disadvantages. It depends on the problem at hand
which strategyis thebest.

## 페이지 6
128
8.1.3 A noteofcaution forcomputing the geometricsource terms
Let us briefly return to the discrete radial momentum equation Eq.(8.13). The term 2P/r ap-
peared because we had to convert the ∂P/∂r into a (1/r2)∂(Pr2)/∂r in order to incorporate
it into the momentum flux difference. It matters, however, how one computes this term. If
done without care, one could easily get a situation in which the case P(r,θ,φ) =constant and
u,v,w = 0 isnot recognized bythesolverasa staticsolution. Onecan, however,replace:
2P
V → P∆ r S r ≡ (S (r),i+1/2,j,k −S (r),i−1/2,j,k )P i,j,k (8.18)
r
If one now computes this geometric pressure source term in this way, then for the case of
P(r,θ,φ) =constant and u,v,w = 0 the solution is kept unaltered, as it should be, down to
machineprecision. Inotherwords,thecodenow“recognizes”theP(r,θ,φ) =constantsolution.
Thereason whythisisthecaseisbecausetheterm2P/r arisesbecauseofthedifferencesinthe
surfaceareas ofthecell interfaces ati−1/2and i+1/2whichare usedinthe∆ (F S )term.
r rr r
So by compensating this with exactly the same but opposite we get an exact cancellation, and
thereby aconstantpressurewillberecognizedas such.
The same trick can be applied to the geometric pressure source term of the θ-momentum
equation:
cosθP
V → P∆ θ S θ ≡ (S (θ),i,j+1/2,k −S (θ),j−1/2,k )P i,j,k (8.19)
sinθ r
Fortheφ-momentumequationno suchgeometricpressureterm arises.
8.1.4 Replacing φ-momentum withangularmomentum
Ifonemodelsrotatingsystemssuch as accretion disksorrotatingstars itcan provetobeadvan-
tageous in terms of accuracy and reliability to not advect the φ-momentum but the φ-angular
momentuminstead(seee.g. Kley1998,A&A338, L37).
Let usdefine l = wsinθr. Weonlyreplace w by l intheadvectioninr and inθ direction.
Thephysicalform oftheφ-momentumequationis then:
∂ρl ∂(ρul) 1∂(ρvl) ∂(ρw2 +P)
+ + +
∂t ∂r r ∂θ ∂φ (8.20)
+2sinθρuw+cosθρvw = 0
whichcan bewrittenas:
∂ρl 1 ∂(r2ρul) 1 ∂(sinθρvl) ∂(ρw2 +P)
+ + + = 0 (8.21)
∂t r2 ∂r rsinθ ∂θ ∂φ
ThediscreteformfortheRiemann solveris:
∂(ρlV)
+∆ (rsinθF S )+∆ (rsinθF S )+∆ (rsinθF S ) = 0 (8.22)
r φr r θ φθ θ φ φφ φ
∂t
Oneseesthatthesourcetermsontheright-handsidearecompletelygone. Thisisgood,because
sourcetermsare alwaysamenace andiftheycan beavoided, thenthatis apositivething.
Forconveniencewecan nowdefine thefluxesfortheφangularmomentum:
F ˜ = rsinθF = ρul (8.23)
φr φr
F˜ = rsinθF = ρvl (8.24)
φr φθ
F˜ = rsinθF = ρwl+Prsinθ (8.25)
φr φφ

## 페이지 7
129
sothen weobtain:
∂(ρlV)
+∆ (F˜ S )+∆ (F˜ S )+∆ (F˜ S ) = 0 (8.26)
r φr r θ φθ θ φ φφ φ
∂t
This means that all we have to do is to construct the normal fluxes F from the Riemann solver,
and convert them into F ˜ for the angular momentum equation (the other equations remain un-
touched),and differencethem.
8.1.5 Rotating polarcoordinate system
Formanypurposesitmaybedesirabletoletthecoordinatesystemrotatewithacertainrate. For
instance,ifwemodeltheflowofairintheEarth’satmosphere,wewanttouseapolarcoordinate
systemthatrotates withtheEarth’s rotationrate, so thatwe can anchorthecoordinatesystemto
thesurfaceoftheEarth. Anotherexampleisthestudyofaccretiondisksaroundyoungstarsand
black holes. This will, however, lead to yet again more “pseudo forces”: the Coriolis force and
the centrifugal force. In fact, they are precisely the same as the pseudo forces we have found in
the static spherical coordinates for moving gas. This time, however, they also appear if the gas
isnotmovingwithrespecttotherotatingcoordinatesystem,becausehavingzero velocityinthe
rotatingframemeans havingnon-zero velocityinthelab frame.
Wecan derivetheequationsfromtheaboveequations. Wereplace:
∂ → ∂ ¯ −Ω ∂ (8.27)
t t 0 φ
w → w¯ +Ω rsinθ (8.28)
0
where Ω is the rotation rate of the polar coordinate system around the polar axis and w¯ is the
0
φ-velocityintherotatingframe. Wekeep,however,theangularmomentumvariablel stillinthe
lab frame, becauseonlyinthelab framethisquantitymakes physicalsense.
One can show that this coordinate transformation does not affect the continuity equation.
The energy conservation equation is also not affected, as long as one still expresses the kinetic
energyinthenon-rotatinglabframe: (u2+v2+w2)/2andnot(u2+v2+w¯2)/2. Thereason is
that energy only has physical meaning in a non-rotating frame. Only the momentum equations
are affected.
So let us look at the r-momentum equation. Because one replaces the time derivativewith
∂ ¯ − Ω ∂ , one gains an extra term −Ω ∂ (ρuV). But one also replaces w with w¯ + Ω rsinθ
t 0 φ 0 φ 0
inthetermwiththe∆ , whichgivesanotherextratermΩ rsinθ∆ (ρuS ). By writingthefirst
φ 0 φ φ
extra term into a discrete form, one sees that the two extra terms cancel. One can also replace
theVw2/r geometricsourcetermwithV(w¯ +Ω rsinθ)2/r. Thisgivestwoextraterms:
0
Vw2/r = V(w¯ +Ω rsinθ)2/r = V(w¯2 +2w¯Ω rsinθ +(Ω rsinθ)2) (8.29)
0 0 0
These are the centrigufal force terms. However, there is no reason why one could not keep the
equation hybrid in w and w¯, as long as the original w only appears outside of the derivatives or
differences. If we use that strategy, then our radial momentum equation in the rotating frame
becomes:
2P ρ(v2 +w2)
∂ ¯ (ρuV)+∆ (F S )+∆ (F S )+∆ (F¯ S ) = + V (8.30)
t r rr r θ rθ θ φ rφ φ
(cid:20) r r (cid:21)
where we have left the original w in the source term (right hand side) and replaced F with
rφ
F¯ = F − Ω rsinθρu = ρuw − Ω rsinθρu = ρuw¯, or in other words, F¯ is the F
rφ rφ 0 0 rφ rφ

## 페이지 8
130
Riemann flux as measured in the local moving reference frame (i.e. as seen by an observer
movingwith velocityΩ rsinθ. So it followsthat the structureof theequation does not change.
0
Just the left-hand-side now refers to fluxes in the moving fame, while the source terms on the
right-hand-side still refer to the lab-frame w. One could also write out w2 in terms of w¯ as in
Eq.(8.29).
Usingthesamephilosophywecanderivetheθ-momentumequationforthecaseofarotat-
ingcoordinatesystem:
vu cosθρw2 +P
∂ ¯ (ρvV)+∆ (F S )+∆ (F S )+∆ (F¯ S ) = − ρ − V (8.31)
t r θr r θ θθ θ φ θφ φ
(cid:20) r sinθ r (cid:21)
whereF¯ = F −Ω rsinθρv = ρvw−Ω rsinθρv = ρvw¯istheRiemannfluxinthecomoving
θφ θφ 0 0
frame.
Finally,fortheangularmomentumequationweget:
∂ ¯ (ρlV)+∆ (F˜ S )+∆ (F˜ S )+∆ (F ¯˜ S ) = 0 (8.32)
t r φr r θ φθ θ φ φφ φ
where F ¯˜ = F ˜ −Ω rsinθρl = ρlw +Prsinθ −Ω rsinθρl = ρlw¯ +Prsinθ. In contrast
φφ φφ 0 0
to F¯ and F¯ , the F ¯˜ is not just a multiplication of the comoving flux. Once we obtain the
rφ θφ φφ
comovingRiemann fluxF¯ = ρw¯2 +P fromtheRiemannsolver,here ishowtoobtainF ¯˜ :
φφ φφ
F ¯˜ = rsinθ(F˜ +ρw¯rsinθ) (8.33)
φφ φφ
So we obtain the comoving Riemann flux F˜ , modify it with the above equation to obtain F ¯˜
φφ φφ
and insertthisintothedifference equation.
8.1.6 The FARGO-trickformodeling nearly Kepleriandisks
Usingarotatingpolarcoordinatesystemis very usefulforinstanceforthestudyofan accretion
diskaroundastar. Thereis,however,aslightproblem. An accretiondiskhasarotationvelocity
according to Kepler’s law Ω (r) = GM/r3, meaning it is differentially rotating. There is
K
no single global Ω that describes thepmain rotation of the fluid so that one can concentrate on
0
perturbations on this disk. Instead, if one fixes the rotation rate of the grid Ω to the Kepler
0
frequency Ω (r ) at radius r , then the accretion disk will have a comoving frame φ-velocity
K 0 0
w¯ that is about zero at r , but it will be strongly negative for r ≫ r and strongly positive for
0 0
r ≪ r . Since the highest characteristic velocities are the ones that limit the global time step,
0
one may be forced to take very small time steps if the outer radius of the grid is much larger
than r or the inner radius much smallerthan r . This may put a severe limitationon the spatial
0 0
dynamicrange.
TheFARGO code ofFrederic Massetsolvesthisprobleminan elegantway. Thetrick is to
makeaschemethat,forthisspecialcase,canadvectovermorethan1cellpertimestep. Thismay
sound peculiar, because if it were so easy, why did we do all the effort to design the advection
algorithms in the previous chapters? The reason we had to do it there was that for normal
hydrodynamics various characteristics move with different speeds and the same characteristics
move with different speeds at different locations. Therefore it was not possible to find a single
timestepby whichonecouldsimplyremapthequantityq toq forexample.
i i+3
Here we can partly use this remapping technique, while doing the rest using the normal
advection schemes. Suppose that within a single time step the gas should move over a distance

## 페이지 9
131
of3.423φ-gridcellsinφ-direction. Wecannowperformtheremappingtrick: wefirstremapall
quantitiesoverprecisely3gridpoints. Whatisleftisanadvectionover0.423gridpoints,which
is then done using our favorite advection scheme or a Riemann solver. The distance in number
of grid cells to move in the remapping step will depend on radius r. The larger abs(r − r ),
0
the larger the remapping step. The number of steps to take equals the distance of advection of
the gas in the present timestep, rounded to the nearest integervalue. The CFL timestep is now
determinedby requiringthat, aftertheremappingstep, noneofthecharacteristics movesfarther
than1 cell sizeineitherdirection.
8.2 Adaptive Mesh Refinement
Using different coordinate systems to fit best to the problem at hand is a useful technique for
problemswith areasonably simplegeometry. However,once thegeometrybecomes morecom-
plex, such as the geometry of a Giant Molecular Cloud with multiple dense cores, then polar
coordinatesdonothelp. Infact,theyonlymakeitmorecomplex. Oneisthenbestadvisedtouse
3-D Cartesian coordinates again. The problem is that these coordinates are not adapted to the
problemathand. Thedenseclumpsmayrequireamuchfinermeshthantherestoftheproblem.
Takingafine meshthroughoutthevolumemay betoocomputationallydemanding.
One way to solve this problem is to use the technique of mesh refinement. This works by
replacing a part of the course grid by a finer grid, possibly even recursively. One thus gets a
patch-work hierarchical grid: Coarser grids higher up the hierarchy and finer grids down in the
hierarchy. If these patches obey certain rules, for instance that each patch of refinement must
either be fully inside a patch of lower resolution or fully outside, then the data management of
thesepatches can bekept reasonably in check. A hierarchical gridis then builtup as a tree. The
basegridstandsatthestemofthetree,andeachpatchoffinerresolutionmeshisabranch,which
can then branch offitselfintoevenfiner patches.
There are several libraries that take care of such hierarchical grid refinement. For instance
the CHOMBO library (written mostlyin C++ but with some F77 parts in it) allows a very large
freedomtochoosethesizeandpositionofthepatches. Anotherlibrary,PARAMESH,iswritten
in F90/F95 and has a somewhat more rigid structuring of the patches, with the advantage of
efficiency. Here the highest level of refinement is a patch of N ×N ×N grid cells. One can
x y z
combine these into a larger block of 2 × 2 × 2 of these grid patches, and this continues all the
way upto themain (lowestresolution)grid.
We will not go into detail on the precise structure of such AMR libraries in this text. We
willjustbriefly discusshowthesethingswork.
In Fig.8.1onecan seehowthetwoabovedescribed AMRtechniquesworkgeometrically.
To construct such grids requires rather complex data management. In a hierarchical struc-
ture, where levels of gridding are strictly based on sub-division of higher-level grids the data
structure is typically a tree-like structure. And typically each level of refinement is an integer
multiple of lower resolution grids, such that a cell at higher resolution will at most have one
neighborofequal orlowerrefinement levelat each ofitscellwalls.
Communication between cells in an AMR tree is complex. The easiest way to do this is
to pad each grid block with ghost cells (1 row for first order schemes, 2 rows for second order
schemes etc). At the beginning of each time step one can then fill the ghost cells and all the
complexity of the AMR data management is done in this ghost-cell filling. Once this is done,
each block of cells can then be handled independently for one time step. This works very well

## 페이지 10
132
Figure8.1. Illustration ofAMRgridding. Left: Ahierarchical cell-division typeofAMR(e.g.
Parameshlibrary). Right: AMRbasedonpatches(e.g.Chombolibrary).
(and is implemented in PARAMESH), but if the highest-refinement level consists of blocks of
1x1x1,thenthere isahugeoverheadofghostcellss: forasecondorder schemein 2-D each cell
is then padded with 24 ghost cells (and in 3-D it’s even worse: 124). The easiest way out is
so make the highest-refinement levels to consist of NxN cells, so that the ghost-cell overhead
compared to the true cells is not so large anymore. If one wants to save memory and overhead,
then a direct management of communication between true cells is desirable. This is, however,
ratherchallengingfrom aprogrammingperspective.
Inanycase,itisstronglyadvisedtouseexistinglibrariesforthedata-managementofAMR,
insteadofwritingsuchlibraries oneself,becauseofthecomplexityofthematter.
8.3 Unstructured grids, or partly structured grids
For many purposes the boundary conditions of the problem at hand are very complex. For
instance: flow in a complex pipe structure, or in a reactor of a factory, or the flow of gas over a
car or airplane etc. For such problems it is important to allow very flexible gridding. There are
manywaysofdoingthis. Themostflexibleisthegriddingusingtrianglesin2-Dortetraedersin
3-D(Fig.8.2-left). Thecreationofgoodgridsusingthistriangulationisnon-trivial,andthisisan
entire field of engineering by itself. One of the main disadvantages of such completely flexible
gridding is that it has difficulty making use of the highly parallel computer architectures now
available, in particular architectures with extremely parallel graphics card accelerators. Such
accelerators need simply structured grids to acquire substantial speeds-ups. For this reason the
complex geometries of the grid are sometimes generated out of patches of regular but curved)
coordinatesystemspatched togetherat theirinterfaces (see Fig.8.2-right).
Wewillnotgo intodetailshere.

## 페이지 11
133
Figure 8.2. Illustration of unstructured gridding. Left: with triangles (or in 3-D: tetraeders).
Right: withpiecewisestructured curvedpatches.
