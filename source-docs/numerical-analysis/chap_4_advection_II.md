# chap_4_advection_II

> 원본: `numerical-analysis/chap_4_advection_II.pdf` (0.1MB, 14 페이지 추출)

## 페이지 1
Chapter 4
Advection algorithms II. Flux
conservation, subgrid models and flux
limiters
In this chapter we will focus on the flux-conserving formalism of advection algorithms, and
we shall discuss techniques to have higher order accuracy without the risk of getting spurious
oscillations in the solutions. This chapter follows in many respects the book of LeVeque, but at
timeswithslightlymodifiednotation,to remainconsistentwiththerest ofthelecturenotes.
4.1 Flux conserving formulation: the principles
So far we have focused mostly on how to move a function over a grid. If we want to apply this
to the equations of hydrodynamics, then we need to keep in mind that these equations are in
factconservationequations. Thispropertyisoffundamentalimportance. Ifwemakesystematic
errorsintheconservationofconservedquantities,thenweacquirebehaviorofoursolutionsthat
is clearly unphysical. Moreover, thefact that we haveconserved quantitiesin oursystem is also
abighelp: ifwecanformulateouralgorithmtoidenticallyconservethesequantitiesnumerically
(down to machine precision of 16 digits in doubleprecision), we have eliminated at least a few
ofpossiblethingsthatcan go wrong.
To numericallyconserve conserved quantitiesis not just a matterof precision. Even with a
reasonably precise algorithm, one could make small but systematic errors each time step. Sup-
posethe relativeerror in the total energy is 10 −4 per timestep, but we need to perform 105 time
steps to reach the end-time of the simulation, then if the error is always in one direction, the
error has accumulated to a factor of 10 by the end of the simulation. Such results are clearly
useless as we have created energy from nothing. Therefore it is a highly desirable property of a
hydrodynamicalcode(oranysolverofhyperbolicequations)ifitisformulatedinanumerically
fluxconservingform.
Of course, even the best flux-conserving formulation is not perfectly flux conserving, as
numerical errors are always made when performing floating-point operations. However, the
IEEEmathroutinesusedbyanyprogramminglanguage(orbuiltintoanychip)aresuchthatsuch
errorsarealwaysonlyatthelastdigit(8thdigitforfloatingpoints,16thdigitfordoubleprecision
floats),andgenerallysucherrorsarenotsystematic,sothattheydonotpropagatetolowerdigits
quickly.
59

## 페이지 2
60
4.1.1 Cellsand fluxes
Theideaoffluxconservingschemesistocreatecellsoutofthegrid,insteadofjustsamplinggrid
points. The grid points now become cell centers located at x , and we now have cell interfaces
i
orcell wallslocated at:
1
x = (x +x ) (4.1)
i+1/2 i i+1
2
where the +1/2 is just a notational trick to denote “in between i and i + 1”. Note that if we
have a grid of N cell centers we have N −1 cell interfaces. But it is also importantto note that
the cells i = 1 (left boundary) and i = N (right boundary) also have to have a cell wall at resp.
i = 1/2 and i = N +1/2. Eq. (4.1) does not clearly define the location of these boundary cell
walls. Wewilltakethemto beat:
1
x = x − (x −x ) (4.2)
1/2 1 2 1
2
1
x N+1/2 = x N + (x N −x N−1 ) (4.3)
2
This then makes a total of N +1 cell interfaces. Let us define, as before, the cell spacing to be
∆x = x −x and∆x = x −x . Forconstantspacingwecanwrite∆xforboth
i+1/2 i+1 i i i+1/2 i−1/2
quantities.
If we now assume this 1-D problem to be in fact a 3-D flow through a pipe with cross-
sectional surface S, then the volume of each cell is: V = ∆x S. In real 3-D hydrodynamic
problemsthecellvolumeswillbesomethinglikeV = ∆x∆y∆z,andthesurfaceisS = ∆y∆z.
We can now regard the cells as volumes containing our conserved quantity qn. The total
i
content ofeach cell isQn = qnV. Thefact that theequationto solveis aconservationequation
i i
means that Qn can only be reduced by moving some of it to neighboring cells. Conversely, Qn
i i
can only be increased by moving something from neighboring cells into cell i. Therefore the
change in Q can be seen as in- and out-flow through the cell interfaces. We can formulate at
i
each cell interface afluxf and say that
i+1/2
dQ
i = (f −f )·S (4.4)
i−1/2 i+1/2
dt
In discreteform:
Qn+1 −Qn
i i = (f i−1/2 −f i+1/2 )·S (4.5)
∆t
Stricly speakwemustdo thisathalf-time:
Qn+1 −Qn
i i = (f n+1/2 −f n+1/2 )·S (4.6)
∆t i−1/2 i+1/2
Overall the sum of Qn is now naturally constant, except for in- or outflow at x = x or x =
i 1/2
x :
N+1/2
N
d
Q = (f −f )S (4.7)
i 1/2 N+1/2
dt
!
i=1
X
IfwemakeuseoftheexpressionsQn = qnV andV = S∆x(assumeconstantgridspacing
i i
fornow)then Eq.(4.6)becomes:
n+1/2 n+1/2
q i n+1 −q i n = f i−1/2 −f i+1/2 (4.8)
∆t ∆x

## 페이지 3
61
orinexplicitform:
∆t
qn+1 = qn + (f n+1/2 −f n+1/2 ) (4.9)
i i ∆x i−1/2 i+1/2
Wehavenowformulatedouradvectionproblemin flux-conservingform.
4.1.2 Non-constant gridspacing
Influxconservingschemesitisverysimpletohandlenon-regulargrids. Supposethatwehavea
grid spacing in x as follows: x = {0.,0.1,0.3,0.6,1.0,1.5,···}, then the ∆x is not anymore a
i
globally constant value. Moreover, it now becomes an interesting question where we define the
cellinterfacesx tobe. Ingeneralthereisnouniquerecipetodefinethex corresponding
i+1/2 i+1/2
tothex forsomenon-regulargridspacing. Aslongasx somewhereinbetweenx andx
i i+1/2 i i+1
ina sensibleway, thenit shouldbefine. Thealgorithmthen becomes:
∆t
qn+1 = qn + (f n+1/2 −f n+1/2 ) (4.10)
i i x i+1/2 −x i−1/2 i−1/2 i+1/2
with the fluxes f n+1/2 given by the particular algorithm used, for instance the donor-cell algo-
i±1/2
rithmoroneofthealgorithmsdescribed inthesectionstocome.
All flux conserving algorithms that are first-order in time are based on Eq.(4.10). All the
cleverness of the advection algorithm is hidden in how f n+1/2 is formulated in terms of the
i+1/2
quantitiesqn . Methodwhich usethistypeof flux-conservingschemes arecalledFiniteVolume
i±k
Methods.
4.1.3 Non-constant advectionvelocity
In mostpractical purposes(in particularin thecase ofhydrodynamics)theadvectionvelocity is
not a globalconstant. If it were, then we wouldnot havehad to go through all thetroublein the
last chapter and in this chapter to invent good advection algorithms, because the solutionwould
havebeen analyticallyknownbeforehand. So theequationwewishtosolveisnow:
∂ q(x,t)+∂ (u(x)q(x,t)) = 0 (4.11)
t x
Note that now the distinction between a conservation equation and a non-conserving advection
equation becomes apparent, and therefore it now becomes even more important to use flux con-
servingschemes ifwewish tosolvetheconservationequation.
So how do we handle non-constant u(x)? First of all, we would still use the fundamental
form of the update described in the previous subsection: Eq. (4.10). Exactly how we construct
the fluxes f n+1/2 from qn and the velocity field u(x) depends very much on the algorithm that
i+1/2 i
weusefortheadvection. Wewilldiscussthisineachoftheexamplesbelow. Ingeneral,though,
it requires the definition of the velocity u at the interfaces: u because the fluxes f
i+1/2 i+1/2
are defined at the interfaces. Depending on the definition of the problem these velocities are
already defined on these interfaces (i.e. the problem definition specifies u ), or they have to
i+1/2
be computed by linear interpolation from cell-centered values u (i.e. if the problem definition
i
specifies u ). NowthediscretealgorithmisthenEq. (4.10)with
i
f n+1/2 = q˜ n+1/2 u (4.12)
i+1/2 i+1/2 i+1/2
whereq˜ n+1/2 issomeestimateofwhat theaverage stateisofq at theinterface:
i+1/2
1 tn+1
q˜ n+1/2 = estimateof q(x ,t)dt (4.13)
i+1/2 t −t i+1/2
n+1 n Ztn

## 페이지 4
62
q
x
q
x
q
x
Figure4.1. Illustration ofthepiecewiseconstant (donor-cell) advection algorithm.
Sincewe(bydefinitionofthefactthatwesolveanumericalproblem)donotknowexactlywhat
this average state is, it is the task of the algorithm to provide a recipe that estimates this as well
as possible. In thetwoexamplesbelowweshalldescribetwosuch algorithms.
4.2 Donor-cell advection
The simplest flux conserving scheme is the donor-cell scheme. In this scheme the “average
interfacestate”is simply:
qn for u > 0
q˜ n+1/2 = i i+1/2 (4.14)
i+1/2 qn for u < 0
(cid:26) i+1 i+1/2
Thismeansthat thedonor-cell interfaceflux is:
u qn for u > 0
f n+1/2 = i+1/2 i i+1/2 (4.15)
i+1/2 u qn for u < 0
(cid:26) i+1/2 i+1 i+1/2
The physical interpretation of this method is the following. One assumes that the density is
constant within each cell. We then let the material flow through the cell interfaces, from left to
right for u > 0. Since the density to the left of the cell interface is constant, and since the
i+1/2
CFL condition makes sure that the flow is no further than 1 grid cell spacing at maximum, we
knowthatforthewholetimebetweentimet andt thefluxthroughthecellinterface(which
n n+1
is q˜ u ) is constant, and is equal to Eq. (4.15). Once the time step if finished, the state
i+1/2 i+1/2
ineach cellhastheformofastepfunction(Fig. 4.1). Togetback totheoriginalsub-gridmodel
we need to average the quantity q(x) out over each cell, to obtain the new qn+1. This is what
i
happensin thedonor-cell algorithm.
This method is very strongly similar to the upstream differencing scheme of Section 3.3.2.
The difference comes to light mainly when either the velocity u is space-dependent or the grid
x isnon-constantlyspaced(seeSection4.1.2). TheDonor-Cellalgorithmiseasilyimplemented
i
but,as theupstreamdifferencingmethod,itisvery diffusive.

## 페이지 5
63
→ Exercise: Quantifythedifferencebetweenthedonor-cellandupstreamdifferencingschemes
fornon-constantgridspacingbywritingtheexpressionsforqn+1 inbothcasesandcompar-
ingthem.
4.3 Piecewise linear schemes
The donor-cell algorithm is a simple algorithm based on the idea that at the beginning of each
time step the state within each cell is constant throughout the cell. The state at the grid cen-
ter is therefore identical to that in the entire cell. The idea that the state is constant in the cell
is, however, just an assumption. One must make some assumption, because evidently we have
not more information about the state in the cell than just the cell-center state. But one could
also make another assumption. One could, for instance, assume that the state within each cell
is a linear function of position. One says that the state is assumed to be piecewise linear (see
Fig.4.2). Theassumptionthatitisalinearfunctionwithinthecelliscalledasubgridmodel: itis
amodelofwhatthestatelookslikeatspatialscalessmallerthanthegridspacing. Theprocedure
of creating a subgrid model based on a discrete value at the cell center is called reconstruction.
The piecewise linear scheme we discuss here is therefore a scheme based on piecewise linear
reconstruction of the function from the discrete values. Such a method, and higher order ver-
sions(suchasthepiecewiseparabolicreconstructiondiscussedinalaterchapter)aresometimes
called MUSCL (”Monotonic Uwind-centered Scheme for Conservation Laws”) schemes after
theoriginalmethodofthiskindproposedby vanLeer(1977).
Withineach cell thestateat thebeginningofthetimestep isnowgivenby
q(x,t = t ) = qn +σn(x−x ) forx < x < x (4.16)
n i i i i−1/2 i+1/2
whereσn is someslope,whichweshalldiscussbelow. We shouldassurethat
i
1
x = (x +x ) (4.17)
i i−1/2 i+1/2
2
so that the state qn is equal to the average of q(x,t = t ) over the cell irrespective of the slope
i n
σn. Thisisnecessary forflux conservation.
i
Let us, from here on, assume that the grid is equally spaced, i.e. that there is a global ∆x.
Let usalso assumethatu > 0 isaconstant.
At theinterface theflux willnowvary withtimebetween t andt :
n n+1
f (t) = uq(x = x ,t)
i−1/2 i−1/2
= uq i n −1 +uσ i n −1 (x i−1/2 −x i−1 −u(t−t n )) (4.18)
1
= uqn +uσn ∆x−u(t−t )
i−1 i−1
2
n
(cid:18) (cid:19)
and similarforf (t). Theaverageflux overthetimestep∆t = (t −t ) is then:
i+1/2 n+1 n
1 tn+1
hf i−1/2 (t)i t t n n +1 = ∆t uq(x = x i−1/2 ,t)dt
Ztn (4.19)
1
= uqn + uσn (∆x−u∆t)
i−1
2
i−1

## 페이지 6
64
q
x
q
x
q
x
Figure 4.2. Illustration of the piecewise linear advection algorithm. The slope is chosen ac-
cordingtoLax-Wendroff’s method.
and similarforf (t). Thedifferenceis:
i+1/2
1
hf i+1/2 (t)i t t n n +1 −hf i−1/2 (t)i t t n n +1 = u(q i n −q i n −1 )+ 2 u(σ i n −σ i n −1 )(∆x−u∆t) (4.20)
UsingEq.(4.10)wethen obtaintheupdateofthestateafteronetimestep:
u∆t u∆t1
qn+1 = qn − (qn −qn )− (σn −σn )(∆x−u∆t) (4.21)
i i ∆x i i−1 ∆x 2 i i−1
where we defined f n+1/2 ≡ hf (t)i tn+1. Eq. (4.21) is the update of the state for a flux-
i+1/2 i+1/2 tn
conserving piecewise linear scheme (assuming that the grid spacing is constant). This is the
higher-order version of the donor-cell algorithm. Note that it is identical to donor-cell if the
slopes are chosen to be zero. Notealso that since we chosethe grid to be constantlyspaced and
the velocity to be globally constant, the algorithm is like an upwind scheme with a correction
term.
The question is now: how shall we choose the slope σn of the linear function? The idea
i
behind the piecewise linear scheme is that one uses the states at adjacent grid points in some
reasonableway. Thereare threeobviousmethods:
Centered slope: σn = qi n +1 −qi n −1 (Fromm’smethod) (4.22)
i 2∆x
Upwindslope: σn = qi n−qi n −1 (Beam-Warming method) (4.23)
i ∆x
Downwindslope: σn = qi n +1 −qi n (Lax-Wendroffmethod) (4.24)
i ∆x
Allthesechoices resultinsecond-orderaccurate methods.
→ Exercise: Prove that the piecewise linear scheme with a downwind slope indeed produces
theLax-WendroffschemeofEq. (3.96)in Chapter3.

## 페이지 7
65
q q
x x
Figure 4.3. Illustration of why higher order schemes, such as the piecewise linear Lax-
Wendroffschemeshownhere,produceoscillations neardiscontinuities.
Ifwenowimplement,forinstance,Fromm’schoiceofslopeintoEq.(4.21)thenweobtain
thefollowingexplicitupdateofthestate(again, validonly forregulargridspacing and constant
u):
u∆t
qn+1 =qn − (qn +3qn −5qn +qn )
i i 4∆x i+1 i i−1 i−2
(4.25)
u2∆t2
− (qn −qn −qn +qn )
4∆x2 i+1 i i−1 i−2
ThisiscalledFromm’smethodofadvection. Onenoticesthatthestencilofthisschemeinvolves
4 points, and that these points are non-symmetric with respect to the updated cell. Only for the
downwindslopeweregaina3-pointstencil.
4.4 Slope limiters: non-linear tools to prevent overshoots
As we have already seen in chapter 3 higher order schemes tend to produce oscillations near
jumps. We have seen that this can mathematically be understood in terms of phase errors and
dispersion. With the current piecewise linear geometric picture of the higher order methods we
can now also gain a geometrical understandingof why such an overshootoccurs. This is shown
inFig. 4.3
In this picture the overshoothappens because the piecewise linear elements can have over-
shoots. A succesful method to prevent such overshoots is the use of slope limiters. These are
non-linear conditions that modify the slope σn if, and only if, this is necessary to prevent over-
i
shoots. This means that, if this is applied to for instance the Lax-Wendroff method, the slope
limiterkeepsthesecondordernatureoftheLax-Wendroffmethodinregionsofsmoothvariation
ofq whileitwillintervenewheneveran overshootthreatens totakeplace.
4.4.1 The “TotalVariation”(TV)
TomeasureoscillationsinasolutionwedefinetheTotalVariation(TV)ofthediscreterepresen-
tationofq to be:
N
TV(q) = |q i −q i−1 | (4.26)
i=1
X
wherei = 1andi = N aretheleftandrightboundariesofthenumericalgridrespectively. Fora
monotonicallyincreasingfunctionqtheTV(q) = |q −q |. Ifq andq aretakentobeconstant,
1 N 1 N
then, as long as the function remains monotonic, the TV(q) is constant. However, if the values
ofq developlocal minimaormaxima, then theTV increases, by virtueof theabsolutevaluein
i
Eq. (4.26). The increase of TV is therefore a measure of the development of oscillations in a
solution.

## 페이지 8
66
q q
x x
minmod slope superbee slope
Figure 4.4. Illustration of the slope limites minmod and superbee. Both clearly prevent over-
shootsinthesubgrid modelsandhenceareTVD.
A numericalschemeissaid tobetotalvariationdiminishing(TVD) if:
TV(qn+1) ≤ TV(qn) (4.27)
Clearly such a scheme will not develop oscillationsnear a jump, because a jump is a monotoni-
cally in/decreasing function and a total variation diminishing scheme will not increase the TV,
and hence in this case keep theTV identically constant. This appears to be a desirableproperty
ofthenumericalscheme.
What about if we already start with a solution that has some local minima and maxima?
In principle a total variation diminishing scheme could conserve the total variation (as long as
it does not increase it). In practice, however, the local minima and maxima will be gradually
smoothed out by such a scheme. Good schemes will do this only very weakly, and will only
really diminishoscillationsnear sharpjumps.
4.4.2 Slopelimiters
So now let us try to formulate a recipe to limit the slope σn of the piecewise linear scheme to
i
makesurethattheresultingschemeisTVD.Oneobviouschoiseistotaketheslopealwayszero.
Wethenrecoverthedonor-cellalgorithm. ThisalgorithmisTVDbecausethepiecewiseconstant
function has the same TV as the continuous function. In fact, as we have discussed in Section
3.9,all first orderschemesare TVD.
For the piecewise linear scheme there are several methods to guarantee TVD. One method
istheminmodslope:
qn −qn qn −qn
σn = minmod i i−1, i+1 i (4.28)
i δx δx
(cid:18) (cid:19)
where
a if |a| < |b| and ab > 0
minmod(a,b) = b if |a| > |b| and ab > 0 (4.29)

0 if ab ≤ 0

This methodchooses thesmallestofthetwo slopes,providedthey bothhavethe samesign,and

chooses0 otherwise. Theminmodslopeis illustratedinFig. 4.4-left.
Anotherefficient slopelimiteris thesuperbeeslopelimiterintroducedbyPhil Roe:
σn = maxmod(σ (1) ,σ (2) ) (4.30)
i i i
with
qn −qn qn −qn
σ (1) = minmod i+1 i ,2 i i−1 (4.31)
i δx δx
(cid:18) (cid:19)
qn −qn qn −qn
σ (2) = minmod 2 i+1 i , i i−1 (4.32)
i δx δx
(cid:18) (cid:19)

## 페이지 9
67
Figure 4.5. Advection with the piecewise linear advection algorithm with 6 different choices
of the slope. Results are shown of the advection of a step function over a grid of 100 points
withgridspacing∆x= 1,after300timestepswith∆t = 0.1.
ThesuperbeeslopeisshowninFig. 4.4-right.
In Fig. 4.5theresultsareshownforall thepiecewiselinearadvectionalgorithmsdiscussed
here.
4.5 Flux limiters
The concept of slope limiters is very closely related to the concept of flux limiters. For flux-
conserving schemes the concept of flux-limiter is more appropriate and can be better imple-
mented. Let us take another look at the time-averaged flux through a cell interface (Eq. 4.19).
Forarbitrary signofuthisbecomes:
uq i n −1 + 1 2 u i−1/2 σ i n −1 ∆x−u i−1/2 ∆t if u i−1/2 ≥ 0
f n+1/2 = (4.33)
i−1/2
 (cid:0) (cid:1)
 uq i n − 2 1u i−1/2 σ i n ∆x+u i−1/2 ∆t if u i−1/2 ≤ 0
(cid:0) (cid:1)


## 페이지 10
68
wherewedroppedthehi tn+1 fornotationalconvenienceandputinsteadan+1/2 todenotethefact
tn
that the flux average is similar to taking the flux at half-time1. We have also now allowed for a
varying velocity u. The velocity u is, in this formulation, defined on the cell interfaces, while
thevalueofq is alwaysdefined atthecell center. Ifwe, forconvenience,introduce
+1 for u ≥ 0
θ ≡ θ(u ) =
i−1/2
(4.34)
i−1/2 i−1/2
−1 for u i−1/2 ≤ 0
(cid:26)
thenwe can write
1
f i n − + 1 1 / / 2 2 = 2 u i−1/2 (1+θ i−1/2 )q i n −1 +(1−θ i−1/2 )q i n +
(4.35)
4 1 |u i−1/2 h | 1− u i− ∆ 1/ x 2 ∆t ∆x (1+θ i−1 i /2 )σ i n −1 +(1−θ i−1/2 )σ i n
(cid:18) (cid:12) (cid:12)(cid:19)
h i
(cid:12) (cid:12)
This expression is identical to(cid:12)Eq. (4.33)(cid:12). It is just written in a single formula using the flip-
(cid:12) (cid:12)
flop function θ which is +1 for positive advection velocity and −1 for negative advection
i−1/2
velocity. This expression is valid for any regularly or non-regularly spaced grid, and for any
constantorvaryingadvectionvelocity. Itisthereforethekindofexpressionweneedfornumeri-
calhydrodynamicsinwhichnon-regulargridsand,moreimportantly,varyingvelocityfieldsare
common.
In Eq.(4.35)itis nowpossibleto replace
1
2 ∆x (1+θ i−1/2 )σ i n −1 +(1−θ i−1/2 )σ i n → φ(r i n −1/2 )(q i n −q i n −1 ) (4.36)
h i
whereweintroduceda fluxlimiterφ(rn ) where rn is defined as:
i−1/2 i−1/2
q q i n − i n 1 − − q q i n − i n − 1 2 for u i−1/2 ≥ 0
rn = (4.37)
i−1/2 
  q q i i n n + − 1 q − i n − qi n 1 for u i−1/2 ≤ 0
We shall discuss expressions for φ(r n ) in a minute, but first let us see how Eq. (4.35) is
i−1/2
modifiedby thisreplacement:
1
f n+1/2 = u (1+θ )qn +(1−θ )qn +
i−1/2 2 i−1/2 i−1/2 i−1 i−1/2 i
(4.38)
1
|u
h
| 1−
u i−1/2 ∆t
φ(rn )(qn −
i
qn )
2 i−1/2 ∆x i−1/2 i i−1
(cid:18) (cid:12) (cid:12)(cid:19)
(cid:12) (cid:12)
We seethat this expressionoftheflux is stil(cid:12)lthedono(cid:12)r-cell flux (first line)plussomecorrection
(cid:12) (cid:12)
term (secondline).
We can now verify that with particular choices of the flux limiter function φ(r) we regain
thevariousrecipes ofSection 4.4:
donor-cell : φ(r) = 0
Lax-Wendroff : φ(r) = 1
(4.39)
Beam-Warming : φ(r) = r
Fromm : φ(r) = 1(1+r)
2
1Note, however,thatthisdoesnotmeanthatwe havea Crank-Nicholsonschemehere! Thisisnotanimplicit
scheme!

## 페이지 11
69
whichare thelinearschemes and
minmod : φ(r) = minmod(1,r)
(4.40)
superbee : φ(r) = max(0,min(1,2r),min(2,r))
which are the high-resolution non-linear schemes. Now that we are at it, there are also many
othernon-linearflux limiterschemes. Twoexamplesare:
MC : φ(r) = max(0,min((1+r)/2,2,2r))
(4.41)
vanLeer : φ(r) = (r +|r|)/(1+|r|)
whereMCstandsformonotonizedcentral-differencelimiter.
A flux limiterhas thefollowingeffect:
• Forsmoothparts ofasolutionitwilldo secondorderaccurate flux-conserved advection.
• For regions near a jump or a very sharp and sudden gradient it will switch to first order
donor-cell (i.e. upwind)flux-conserved advection.
Flux limiters therefore make sure that one gets the best of both second order and first order
methods. Flux limiters will turn out to play a major role for shock capturing hydrodynamics
codes, inwhichshocksneed to bekept tightand notsmearoutovertoomanygridcells. Forthe
modelingofsupersonicflowswithshockwaves(such as thoseoftenfound inastrophysics)they
are a highly useful tool. However, one should keep in mind that they may artificially steepen
gradients that may not actually be meant to be steepened. They therefore have to be used with
care.
4.6 Overview of algorithms
As afinal remark wegivehere atableofthepropertiesofthevariousalgorithms:
Name Order Lin? Stable? TVD? Stencil
Two-pointsymmetric 1 lin - -
Upwind/ Donor-cell 1 lin + +
Lax-Wendroff 2 lin + -
Beam-warming 2 lin + -
Fromm 2 lin + -
Minmod 2/1 non-lin + +
Superbee 2/1 non-lin + +
MC 2/1 non-lin + +
van Leer 2/1 non-lin + +

## 페이지 12
70
4.7 Computer implementation (adv-2): cell interfaces and ghost cells
The computer implementationis now a bit more complicated than in chapter 3 because we now
have cells, and cell-interfaces. In this section we will see how to deal with this in a proper way.
Alsowewillintroducetheconceptofghostcellswhichisasimpletricktoimplementboundary
conditions in a very easy way, even periodic boundary conditions. It will help us greatly when
wewilldo thehydrodynamicsinthelaterchapters.
Let us,as intheprevioussection,setup theproblemin IDL/GDL.First thegrid:
nx = 100
x = dblarr(nx+2)
xi = dblarr(nx+3)
Herewehave100regulargridpointswithaghostcelloneachside. Wehavetherefore102cells
with 103 cell walls. We now also define the array for q, for the temporary array qnew and for
theflux f:
q = dblarr(nx+2)
qnew = dblarr(nx+2)
f = dblarr(nx+3)
Nowweset upthegrid
dx = 1.d0 ; Set grid spacing
for i=0,nx+1 do x[i] = (i-1.d0) * dx
for i=1,nx+1 do xi[i] = 0.5 * ( x[i] + x[i-1] )
xi[0] = x[0] - 0.5 * ( x[1] - x[0] )
xi[nx+2] = x[nx+1] + 0.5 * ( x[nx+1] - x[nx] )
where we made the grid regular with grid spacing dx. Note that the cell walls are indexed such
that wall i is left of cell i (see Fig. 4.6). Now we set up the initial condition and the advection
velocityarray
for i=0,nx-1 do if x[i] lt 30. then q[i]=1.d0 else q[i]=0.d0
u = 1.d0 + dblarr(nx+3)
Notethat theadvectionvelocityarray isalsodefined on thecell walls. Nowthemainpartofthe
codeis:
dt = 2d-1
tend = 70.d0
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

## 페이지 13
71
;;
;; Impose cyclic (=periodic) boundary conditions
;; using the ghost cells
;;
q[0] = q[nx]
q[nx+1] = q[1]
;;
;; Make the flux
;;
for i=1,nx+1 do begin
if u[i] gt 0 then begin
f[i] = q[i-1] * u[i]
endif else begin
f[i] = q[i] * u[i]
endelse
endfor
;;
;; Do the advection
;;
for i=1,nx do begin
qnew[i] = q[i] - dtused * ( f[i+1] - f[i] ) / $
( xi[i+1]- xi[i] )
endfor
;;
;; Copy back
;;
for i=1,nx do begin
q[i] = qnew[i]
endfor
;;
;; Update time
;;
time = time + dtused
endwhile
Here we have imposed cyclic (periodic) boundary conditions, just as an example how useful
ghost cells can be. We have also made sure that the algorithm works for any u(x), also if it is a
functionofxand ifitchanges sign. Ifwenowend theprogram with
plot,x[1:nx],q[1:nx],psym=-6
end
then we will see a figure on the screen like Fig. 4.7. Note that the periodic boundary conditions
have the effect that the diffusivesmearing now affects the front- and the back-side of the block
function,incontrasttothecaseofFig.3.6. Alsonotethatinthepresentprogramwewentallthe
waytot = 70insteadoft = 30ofFig.3.6. Thesmearinghasnowalmostentirelydestroyedthe
blockfunction.

## 페이지 14
72
Domain of interest
Ghost Ghost
cell cell
0 1 2 3 4 nx nx+1 Mathematical
−1/2 1/2 3/2 5/2 7/2 9/2 nx+1/2 nx+3/2 indices
0 1 2 3 4 nx nx+1 Computer
0 1 2 3 4 nx nx+1 nx+2 indices
Domain of interest
Ghost Ghost Ghost Ghost
cell cell cell cell
−1 0 1 2 3 4 nx nx+1 nx+2 Mathematical
−3/2 −1/2 1/2 3/2 5/2 7/2 9/2 nx+1/2 nx+3/2 nx+5/2 indices
0 1 2 3 4 nx nx+1 nx+2 nx+3 Computer
0 1 2 3 4 nx nx+1 nx+2 nx+3 nx+4 indices
Figure 4.6. The grid of a flux-conserving advection program including ghost cells, for algo-
rithms with a three-point stencil (upper panel) and for algorithms with a four- or five-piont
stencil(lowerpanel).
Figure 4.7. The plot resulting from the donorcell.pro program of Section 4.7. Note that in
contrast to Fig. 3.6 we now have continued the simulation until time t = 70 and we have
imposedperiodicboundary conditions. Hencethedifference toFig.3.6.
