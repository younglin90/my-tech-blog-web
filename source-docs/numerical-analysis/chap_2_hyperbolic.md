# chap_2_hyperbolic

> 원본: `numerical-analysis/chap_2_hyperbolic.pdf` (0.1MB, 14 페이지 추출)

## 페이지 1
Chapter 2
Hyperbolic equations
As we have seen, and will further argue below, the hydrodynamics equations are nothing more
than signal-propagation equations. Equations of this kind are called hyperbolic equations. The
equations of hydrodynamics are only a member of the more general class of hyperbolic equa-
tions, and there are many more examples of hyperbolic equations than just the equations of
hydrodynamics. But of course we shall focus mostly on the application to hydrodynamics. In
this chapter we shall study the mathematical properties of hyperbolic equations, and analytic
methodshow to solvethem for simplelinear problems. This background knowledgeis not only
importantforunderstandingthenatureofhydrodynamicflows,italsoliesat thebasisofnumer-
ical hydrodynamicsalgorithms. Hence wegointoquitesomedetailhere.
2.1 The simplest form of a hyperbolic equation: advection
Considerthefollowingequation:
∂ q +u∂ q = 0 (2.1)
t x
where q = q(x,t) is a function of one spatial dimension and time, and u is a velocity that
is constant in space and time. This is called an advection equation, as it describes the time-
dependent shifting of the function q(x) along x with a velocity u (Fig. 2.1-left). The solutionat
anytimet > t can bedescribed as afunctionofthestateat timet :
0 0
q(x,t) = q(x ut,0) (2.2)
−
This is a so-called initial value problem in which the state at any time t > t can be uniquely
0
foundwhenthestateattimet = t isfullygiven. Thecharacteristicsofthisproblemarestraight
0
lines:
x (t) = x (0) +ut (2.3)
char char
This is a family of lines in the (x,t) plane, each of which is labeled by its own unique value of
x (0) .
char
Inthisexampletheinitialvalueproblemisquitetrivial,yet,aswewillseebelow,thisprob-
lem stands at the basis of numerical methods of hydrodynamics and is numerically surprisingly
challengingtosolve!
23

## 페이지 2
24
q(x) q(x)
conserved quantity
pure advection
space space
u(x) u(x)
space space
Figure 2.1. Advection of a function q(x,t) with constant velocity u (left) and space-varying
velocityu(x)(right). Thespace-varyingvelocityproblemcomesintwoversions: theconserved
form(dashed) andthenon-conserved simpleadvectionform(dotted).
2.2 Advection with space-dependent velocity
Considernowthatuis afunctionofspace: u = u(x). Weget:
∂ q +u(x)∂ q = 0 (2.4)
t x
This is still an advection problem, but the velocity is not constant, and therefore the solution is
somewhatmorecomplex. Define thefollowingvariable:
x dx′
ξ = (2.5)
u(x′)
Zx0
forsomearbitary x . Nowthesolutionis givenas:
0
q(x,t) = q(x(ξ),t) = q(x(ξ t),0) (2.6)
−
where x(ξ) is the value of x belonging to the value of ξ. We see that in regions of low u(x)
the function will be squeezed in x-direction while in regions of high u(x) the function will
be stretched. Fig. 2.1-right, dotted line, shows the squeezing effect for non-constant advection
velocity.
Thecharacteristics are:
x (t) = x(ξ (0) +t) (2.7)
char char
In this case the labeling is done with ξ (0) and, by definition, the curves follow the flow in the
char
(x,t) plane.
Ifwedefine thecomovingderivativeD as D = ∂ +u(x)∂ , Eq.(2.4)translatesinto:
t t t x
D q(x,t) = 0 (2.8)
t
Thissimplytellsthatalongeachflowline(characteristic)thefunctionqremainsconstant,i.e.the
comovingderivativeiszero.

## 페이지 3
25
2.3 Advection of a conserved quantity with space-dependent velocity
Nowconsideryetanotherversionoftheadvectionequation:
∂ q +∂ [qu(x)] = 0 (2.9)
t x
This is very similarto Eq. (2.4), but thistimewithu(x) insidethe ∂ operator. Thisis a conser-
x
vationequation. Ithasthefollowingpropertyofconservation: ifu(x)iszero atx andx > x ,
0 1 0
thentheintegral
x1qdxis
constantintime.
x0
Thisequationcan bewrittenin thepreviousform, withu(x)outsidetheoperator:
R
∂ q +u(x)∂ q = q∂ u(x) (2.10)
t x x
−
This is an advection equation of the type of Eq. (2.4), but this time with a non-zero right-hand-
side. This can be regarded as some kind of source term in the equation (even though strictly
speaking it is not, as the system is conserved). The characteristics are the same as for the case
withoutthisterm,butinthiscasethevalueofq isnolongerconstantalongthesecharacteristics:
D q(x,t) = q(x,t)∂ u(x) (2.11)
t x
−
When the characteristics converge, q goes up, and when they diverge, q goes down. This is de-
pictedin Fig.2.1-right,dashed line. Thisispreciselywhat oneexpectstohappen ifq represents
somekindofdensity.
2.4 Flux-form of conservation equation and the Jacobian
Let usstickwiththeequation(2.9), butwriteitinthefollowingform:
∂ q +∂ f(q,x) = 0 (2.12)
t x
wheref(q,x)iscalledthefluxofthequantityq. Thefluxf isentirelydeterminedforanygiven
valueofthefunctionq and positionx. We can thenusethechainruleto arriveat
∂f ∂f(q,x)
∂ q + ∂ q = (2.13)
t x
∂q − ∂x
(cid:12)x=const (cid:12)q=const
(cid:12) (cid:12)
(cid:12) (cid:12)
In ourcasewehave:
(cid:12) (cid:12)
∂f ∂f
= u(x) and = q∂ u(x) (2.14)
x
∂q ∂x
(cid:12)x=const (cid:12)q=const
(cid:12) (cid:12)
(cid:12) (cid:12)
InthiswaywealsoarriveatEq.(2.10). ItisthisroutetoEq.(2.10)thatwewilltakeinthecases
(cid:12) (cid:12)
of the more complex non-linear systems of equations to follow. The ∂f/∂q is the Jacobian of
thesystem.
2.5 Coupled set of equations
All of the abovecan also be formulated for coupled sets of PDEs. Instead of a state scalar q we
defined a statevectorQ = (q , ,q ). Theadvectionequationofthenon-conservativetypeis
1 m
···
then
∂ Q+A∂ Q = 0 (2.15)
t x

## 페이지 4
26
whereAis an m mmatrix. Theadvectionequationofconservativetypeis
×
∂ Q+∂ (AQ) = 0 (2.16)
t x
Themoregeneral conservationequationis:
∂ Q+∂ F = 0 (2.17)
t x
whereF = F(Q,x) istheflux. Likein thescalar casewehave
∂F ∂F(q,x)
∂ Q+ ∂ Q = (2.18)
t x
∂Q − ∂x
(cid:12)x=const (cid:12)Q=const
(cid:12) (cid:12)
(cid:12) (cid:12)
where the J ∂F/∂Q is the Jaco(cid:12)bian of the system, which(cid:12)is an m m matrix. If F is a
≡ ×
linearfunctionofQ, thenonecan writeF = AQwhereAis thentheJacobian,and wearriveat
Eq.(2.16). IfAis thenalsoindependentofx, thenwearriveat Eq. (2.16).
2.6 The wave equation in vector notation: eigenvalues and eigenvectors
InSection1.7.1wederivedthewaveequationforperturbationsinanotherwisesteadyconstant-
densityconstant-velocitybackground medium. Let usnowdefine:
q ρ
Q 1 = 1 (2.19)
≡ q ρ u
2 0 1
(cid:18) (cid:19) (cid:18) (cid:19)
Wecan then writeEqs.(1.56,1.57)as:
q u 1 q
∂ 1 + 0 ∂ 1 = 0 (2.20)
t q C2 u x q
(cid:18) 2 (cid:19) (cid:18) s 0 (cid:19) (cid:18) 2 (cid:19)
Wecan also writethisin flux conservativeform:
q f
∂ 1 +∂ 1 = 0 (2.21)
t q x f
2 2
(cid:18) (cid:19) (cid:18) (cid:19)
withtheflux F = (f ,f ) givenas:
1 2
f u 1 q u q +q
F 1 = 0 1 = 0 1 2 (2.22)
≡ f C2 u q C2q +u q
(cid:18) 2 (cid:19) (cid:18) s 0 (cid:19)(cid:18) 2 (cid:19) (cid:18) s 1 0 2 (cid:19)
orinotherwords,theJacobianmatrixis:
∂f u 1
J = i = 0 (2.23)
ik ∂q C2 u
k (cid:18) s 0 (cid:19)
One of the advantages of writing the wave equation, and lateron many other equations, in
the form of a matrix equation like Eq. (2.20), is that we can use some aspects of linear alge-
bra to solve the equations in an elegant way, which will later turn out to have a very powerful
applicationinnumericalmethodsofhydrodynamics.

## 페이지 5
27
let us look again at the Jacobian matrix of the wave equation, Eq. (2.23). This matrix has
thefollowingeigenvectorsand eigenvalues:
1
e = with λ = u C (2.24)
−1 C −1 0 − s
s
(cid:18)− (cid:19)
1
e = with λ = u +C (2.25)
+1 +C +1 0 s
s
(cid:18) (cid:19)
Ifweincludethepassivetracer ofEq. (1.7.2)wehave:
q ρ
1 1
Q q = ρ u (2.26)
2 0 1
≡    
q ϕ
3
   
and thematrixform oftheequationofmotionbecomes:
q u 1 0 q
1 0 1
∂ q + C2 u 0 ∂ q = 0 (2.27)
t  2   s 0  x  2 
q 0 0 u q
3 0 3
     
Thishas thefollowingset ofeigenvectorsandeigenvalues:
1
e = C with λ = u C (2.28)
−1 s −1 0 s
−  −
0
 0 
e = 0 with λ = u (2.29)
0 −1 0
 
1
1
e = +C with λ = u +C (2.30)
+1 s +1 0 s
 
0
 
Wecan nowdecomposeanyvectorq intoeigenvectors:
Q = q˜ e +q˜ e +q˜ e (2.31)
−1 −1 0 0 +1 +1
Then theequationofmotionbecomes:
q˜ u C 0 0 q˜
−1 0 s −1
−
∂ q˜ + 0 u 0 ∂ q˜ = 0 (2.32)
t 0 0 x 0
     
q˜ 0 0 u +C q˜
+1 0 s +1
     
The matrix is here diagonal. This has theadvantagethat we havenow decomposedthe problem
intothreescalaradvectionequations:
∂ q˜ +λ ∂ q˜ = 0 (2.33)
t i i x i
for any i = 1,0,+1. For these equations we know the solution: they are simply shifts of an
−
initial function (see Sections 2.1 and 2.2). In the case at hand here we are fortunate that the C
s
and u areconstant,so weget:
0
q˜(x,t) = q˜(x λ t,0) (2.34)
i i i
−

## 페이지 6
28
for any i = 1,0,+1. The vector-notation and the decomposition into eigenvectors and eigen-
−
valuesstandsat thebasis ofmuch ofthetheory onnumerical algorithmstofollow.
The system of equations described here is a hyperbolic set of equations, which is another
way ofsayingthat theydescribethemotionofsignals. Wewilldefine hyperbolicitymorerigor-
ouslybelow.
2.7 Hyperbolic sets of equations: the linear case with constant Jacobian
Let usconsiderasetoflinearequationsthatcan bewrittenin theform:
∂ Q+A∂ Q = 0 (2.35)
t x
whereQis avectorofmcomponentsand Aisan m mmatrix.
×
Thissystemiscalled hyperbolicifthematrixAisdiagonalizablewithreal eigenvalues.
The matrix is diagonalizable if there exists a complete set of eigenvectors e , i.e. if any vector
i
can bewrittenas:
m
Q = q˜e (2.36)
i i
i=1
X
In thiscaseonecan write
m
AQ = λ q˜e (2.37)
i i i
i=1
X
Wecan define amatrixinwhich each columnisoneoftheeigenvectors:
R = (e , ,e ) (2.38)
1 m
···
Then wecan transformEq. (2.35)into:
R−1∂ Q+R−1ARR−1∂ Q = 0 (2.39)
t x
whichwithQ˜ = R−1Qthen becomes:
∂ Q˜ +A˜∂ Q˜ = 0 (2.40)
t x
whereA ˜ = diag(λ , ,λ ). Not allλ mustbedifferentfrom each other.
1 m i
···
This system of equations has in principle m sets of characteristics. But any set of charac-
teristics that has the same characteristic velocity as another set is usually called the same set of
characteristics. So in the case of 5 eigenvalues, three of which are identical, one typically says
thatthereare threesetsofcharacteristics.
2.8 Boundary conditions (I)
So far we have always assumed that space is infinite. In real-life applications the domain of
interest is always bound. In some cases these boundaries are real (like a wall or a piston) but
in other cases they have to be somewhat artificially imposed because computing power is not
as infinite as space is and one is limited to a finite volume. It is therefore important to know
how spatial boundary conditions are set. In the numerical chapters we will go into this in far
more detail than here, often going into more practical matters. Here we are concerned with the
mathematicalissue.

## 페이지 7
29
Welookat thegeneral hyperbolicequation
∂ Q(x,t)+A∂ Q(x,t) = 0 (2.41)
t x
whereQisanvectorwithmcomponentsandAisanm mmatrix. Letusdefineasourdomain
×
of interest the space between x and x > x . At these boundaries we wish to impose the
0 1 0
necessary and sufficient boundary conditions. Since this is a coupled set of m linear equations
we need m boundary conditions. In systems of hyperbolic equations one usually sets Dirichlet
boundary conditions, i.e. one speficies the values of the components of Q at these boundaries.
Thebestway to dothisisto decomposeintotheeigenvaluesofA:
∂ q˜(x,t)+λ ∂ q˜(x,t) = 0 (2.42)
t i i x i
Foreach i [1, ,m]onecan then set:
∈ ···
q˜(x = x ,t) = q˜ (bc) (t) (2.43)
i 0|1 i
The x means that one can either specify that condition for q˜ at x = x or at x = x . For
0|1 i 0 1
instance, for m = 2 one could specify one condition at x for q˜ and one condition at x for q˜ .
0 1 1 2
In total one can impose m conditions, divided over the left and right boundaries. Note, by the
way,that theboundary conditionsmaybetime-dependent!
Thequestionnowis: forsomeq˜,atwhichboundaryshouldweimposetheDirichletbound-
i
arycondition? Supposeλ > 0. Itisthenclearthatsignalspropagatefromlefttoright. Therefore
i
it is clear that the boundary condition, for q˜, must be set at the left boundary, at x = x . The
i 0
conditionspecifiestheinflowofthesignalintothesystemthroughtheleftboundary. Ifonewere
to specify it at the other boundary (which in a numerical simulationone could simply try to do,
andseewhathappens),thentheinstalledboundaryvalueisimmediatelyadvectedoffthedomain
again and will not influence the solution within the domain at all. In contrast, setting q˜ at the
i
left boundarymeansthat thisvalueisadvected intothedomainand affects thesolutionthere.
In general one can say that at boundary x = x one specifies q˜(x = x ,t) = q˜ (bc) (t) for
0 i 0 i
all i for which λ > 0 and at boundary x = x one specifies q˜(x = x ,t) = q˜ (bc) (t) for all i for
i 1 i 1 i
whichλ < 0.
i
Another possible kind of boundary conditions are periodic boundary conditions. Here we
set,at every timet, forλ > 0:
i
q˜(x = x ,t) := q˜(x = x ,t) (2.44)
i 0 i 1
In thisway, theinformationflowing out of the rightboundary flows back into the left boundary.
Thesystemis inthisway closedand depends nowonlyontheinitialconditions.
2.9 Hyperbolic sets of equations: the linear case with variable Jacobian
So what happensifthematrixAdependson x, i.e. A A(x)? In thiscasealso theeigenvalues
→
change with position, like described in Section 2.2. But in addition to this also the eigenvectors
can depend on spatial position x, and hence the diagonalization of the matrix. In other words,
the transformation matrix becomes a local matrix: R R(x). This means that on cannot
→
decomposeQintocharacteristicmodesglobally,butthishastobedonelocally. Thisalsomeans
thatthemodesget mixed. Considerthefollowingexample:
q cosx sinx q
∂ 1 + ∂ 1 = 0 (2.45)
t q sinx cosx x q
2 2
(cid:18) (cid:19) (cid:18) − (cid:19) (cid:18) (cid:19)

## 페이지 8
30
on a domain limited by x = 0 and x = π. The eigenvalues of the matrix are always 1, but
0 1
±
the eigenvectors change with x. At both x = x = 0 and x = x = π the eigenvectors can be
0 1
written as e = (1,0) and e = (0,1), while at, for example, x = π/2 we have e = (1,1)/√2
1 2 1
and e = ( 1,1)/√2. Ormoregeneral:
2
−
cosx
e = (2.46)
1 sinx
(cid:18) (cid:19)
sinx
e = − (2.47)
2 cosx
(cid:18) (cid:19)
(the eigenvectors at x are now minus those of x , but there is no difference in the meaning as
1 0
thenormoftheeigenvaluesare irrelevantexcept inthedefinitionofthenorm ofq˜).
i
Ifwesetq˜ (x ) = q (x ) = f(t)wheref(t)issomefunctionoftimet,andwesetq˜ (x ) =
1 0 1 0 2 1
0 and the initial value of q˜at q˜(x,t = t ), then the signal put into mode q˜ at the left boundary
i 0 1
initially propagates from left to right, but as it gets to larger x it starts to mix with the q˜ mode,
2
whichmovesin oppositedirection.
This example shows that although hyperbolic equations are about signal propagation, this
does not mean that the signals are simply pure waves moving across the domain, but can in-
stead interact with each other even if the equations are linear. However, locally one can always
uniquely divide the state vector Q up into the characteristic modes moving each at their own
characteristicspeeds.
2.10 Boundary conditions (II)
When the Jacobian m m matrix A depends on x, the question of how and where to impose
×
boundary conditions can become, in some circumstances, a bit more difficult. The limitation
that one must impose precisely m boundary conditions is no longer strictly true. It turns out to
dependonthenumberofinward-pointingcharacteristicsateachoftheboundaries. Considerthe
simpleexampleofscalaradvectionproblembetweenx = 1and x = 1withadvectionspeed
0 1
−
A(x) = u(x) = x:
∂ q +x∂ q = 0 (2.48)
t x
In this case, at x = x = 1 the characteristic is pointing out of the domain. But the same is
0
−
true at x = x = 1! So neither at x nor at x must one determine boundary conditions. The
1 0 1
oppositeexample
∂ q x∂ q = 0 (2.49)
t x
−
requires a Dirichlet boundary condition to be set at both boundaries. Here the information (sig-
nal)flowsintothedomainon bothsidesand pilesup nearx = 0.
Ingeneralwhenthesignofaneigenvalueflipsonehastheriskthatthenumberofboundary
conditionsdeviatesfromm. Thephysicalinterpretationofsign-flipsofeigenvaluescanbemany.
Forinstance,asweshallseelater,thesignofoneoftheeigenvaluesflipsinthecaseofastanding
shock in hydrodynamics. Indeed, signals pile up on both sides of the shock and a catastrophy
can only be avoided by the minute, but essential viscosity in the shock front which (only very
locally) ‘erases’ these converging signals again in a non-hyperbolic manner. But these issues
willbediscussedinthechapteronsupersonicflows andshocks,chapter ??

## 페이지 9
31
2.11 Hyperbolic equations versus elliptic equations
As mentioned above, if the Jacobian matrix can be diagonalized and the eigenvalues are real,
thenthesystemishyperbolic. Sowhatiftheeigenvaluesareimaginary? Considerthefollowing
system,similarto theequationsforwaves inhydrodynamics:
q 0 1 q
∂ 1 + ∂ 1 = 0 (2.50)
t q 1 0 x q
2 2
(cid:18) (cid:19) (cid:18) (cid:19) (cid:18) (cid:19)
defined on adomainx [x ,x ]. Thisclearly can bewritten as:
0 1
∈
∂2q ∂2q = 0 (2.51)
t 1 − x 1
whichisawaveequationwitheigenvalueλ = 1 andλ = 1. IfthestateQisgivenat time
−1 +1
−
t = t , and the boundary conditionsare specified at x = x and x = x in the way explained in
0 0 1
Section 2.8, then thefunction Q(x,t) within thedomain can be computed for all t > t (in fact,
0
alsobackward intime).
Nowconsiderthefollowingequation:
q 0 1 q
∂ 1 + ∂ 1 = 0 (2.52)
t q 1 0 x q
2 2
(cid:18) (cid:19) (cid:18)− (cid:19) (cid:18) (cid:19)
defined on adomainx [x ,x ]. Thiscan bewritten as:
0 1
∈
∂2q +∂2q = 0 (2.53)
t 1 x 1
However, this is not a hyperbolicequation. The eigenvalues of the Jacobian matrix are i. It is
±
clearthatwecannotdothesametrickwitheigenvectorsandeigenvalueshere,becauseitdoesnot
makesensetomovesomethingwithaspeed i. Thenatureofthisequationisthereforeentirely
±
different even though it is merely one minus sign in the Jacobian matrix. In fact, Eq. (2.53)
can be recognized as the Laplace equation. It needs the specification of boundary conditions at
x = x , x = x , t = t and t = t . In otherwords: the stateat sometimet depends not only on
0 1 0 1
the past but also on the future. Clearly this makes not much sense, and the Laplace equation is
usuallymoreused intwo (ormore)spatialdirectionsinstead ofspace andtime.
2.12 Hyperbolic equations: the non-linear case
Theabovedefinitionforlinearhyperbolicsetsofequationscanbegeneralized tonon-linearsets
ofequations. Letus focuson thegeneral conservationequation:
∂ Q+∂ F = 0 (2.54)
t x
where, as ever, Q = (q , ,q ) and F = (f , ,f ). In general, F is not always a linear
1 m 1 m
··· ···
function of Q, i.e. it cannot always be formulated as a matrix A times the vector Q (except if
A is allowed to also depend on Q, but then the usefulness of writing F = AQ is a bit gone).
So let us assume that F is some non-linear function of Q. Let us, for the moment, assume that
F = F(Q,x) = F(Q), i.e. we assume that there is no explicit dependence of F on x, except
throughQ. Then accordingto Eq.(2.18)weget
∂F
∂ Q+ ∂ Q = 0 (2.55)
t x
∂Q

## 페이지 10
32
Figure2.2. Characteristics ofBurger’sequation. Left: caseofdivergingcharacteristics. Right:
case of converging characteristics with the formation of a singularity. Beyond the time of the
creation of the singularity the solution is ill defined unless a recipe is given how to treat the
singularity.
where ∂F is the Jacobian matrix, which depends, in the non-linear case, on Q itself. We can
∂Q
neverthelessdecomposethismatrixin eigenvectors(whichdepend onQ) and weobtain
λ
1
∂ Q ˜ + ... ∂ Q ˜ = 0 (2.56)
t   x
λ
m
 
 
Heretheeigenvaluesλ , ,λ andeigenvectors(andhencethemeaningofQ˜)depends onQ.
1 m
···
Inprinciplethisisnotaproblem. ThecharacteristicsarenowsimplygivenbythestatevectorQ
itself. Thestateis, soto speak,self-propagating. We arenowgettingintothekind ofhyperbolic
equationslikethehydrodynamicsequations,which arealsonon-linearself-propagating.
2.13 Example of non-linear conservation equation: Burger’s equation
Consider
1
∂ q + ∂ (q2) = 0 (2.57)
t x
2
This is called Burger’s equation. It is a conservation equation in q, with flux f(q) = q2/2. The
flux is only dependent on x throughq. We have∂f/∂q = q, so we can writethe aboveequation
as
∂ q +q∂ q = 0 (2.58)
t x
So theadvectionvelocityis,in thisimportantexample,theto-be-advectedquantityq itself! The
quantity propagates itself with u = q. If we use the comoving derivative, then we obtain the
followingequation:
D q(x,t) = 0 (2.59)
t
which appears to be identical to Eq. (2.8). The difference lies in the definition of D which is
t
definedwithrespecttoagivenfunctionu(x)inEq.(2.8)andwithrespecttoq(x,t)inEq.(2.59).
Eq. (2.59) shows that along a characteristic the value of q does not change, or in other
words: the characteristic speed (slope in the x,t-plane) does not change along a characteristic.
This means that the characteristics are straight lines in the (x,t)-plane, as in the case of the
example of Section 2.3. The difference to that example lies in the fact that in this case not all
straightlinecharacteristics areparallel.
The interpretation of Burger’s equation is that of the motion of a pressureless fluid. Often
it is said to be the equation describing the motion of dust in space, as dust clouds do not have

## 페이지 11
33
pressure and each dust particle moves along a straight line. This is only partially correct, as we
shallshowbelow,butit doesdescriberoughlythepoint.
Since any non-parallel straight lines in (x,t) must have a crossing at some point in space
we can immediately derive that for converging flows there will be a point at which Burger’s
equationsbreak down.
Now to come back at the difference of Burger’s equation with the motion of dust. In
Burger’s equation the assumption is that at any time and any position there exists only one ve-
locity. In caseofdustflowsthisisnotnecessary: sincetheparticlesdonotinteract, at anygiven
time and position one can have dust particles flowing left, right at various velocities. If two
dustcloudapproach,inBurger’s equationtheequationsproduceshocks(i.e.abreakdownofthe
pure inviscidequation). In thecase of dust theparticles would not feel each other and the cloud
simplygo througheach other.
Perhaps a more adequate physical interpretation of Burger’s equation is that of a pressure-
less fluid. If the characteristics converge a shock will happen and Burger’s equation will no
longer be valid and will be replaced by the more generally valid hydrodynamics equation with
pressure.
Exercise: As we have shown in Section 2.3 a conserved quantity tends to grow in regions
→
ofconvergingflowandittendstodiminishinregionsofdivergingflow. IncaseofBurger’s
equation it appears that this is not the case, as the equation amounts to D q = 0. Give a
t
modified version of Burger’s equation that does have this property of increasing value for
convergingflow,and notewhich isthecharacteristicspeed.
2.14 Isothermal hydrodynamic equations
The topic of this lecture is hydrodynamics, so let’s express the equations of hydrodynamics in
theaboveform. Let’staketheisothermalequationsforsimplicity. Wehave
∂ ρ+∂ (ρu) = 0 (2.60)
t x
∂ (ρu)+∂ (ρu2 +ρc2) = 0 (2.61)
t x s
Let usdefine
q ρ , q ρu (2.62)
1 2
≡ ≡
Then wecan writetheaboveequationsas
∂ t q q 1 +∂ x q2 2 + q 2 q c2 = 0 (2.63)
(cid:18) 2 (cid:19) q1 1 s!
orinotherwords: Q = (q ,q )andF = (q ,q2/q +q c2). ThiscanbewrittenwiththeJacobian:
1 2 2 2 1 1 s
0 1
q q
∂ t q 1 + c2 q2 2 2q2 ∂ x q 1 = 0 (2.64)
(cid:18) 2 (cid:19) s − q1 2 q1 ! (cid:18) 2 (cid:19)
(cid:16) (cid:17)
Theeigenvaluesare
q
λ = 2 c = u c (2.65)
± s s
q ± ±
1
and theeigenvectorsare:
1
e = (2.66)
± λ
±
(cid:18) (cid:19)

## 페이지 12
34
One sees that both the eigenvaluesand the eigenvectorsdepend on thestate vector(q ,q ) itself
1 2
andarethereforespace-andtime-dependent. Thestatevectordeterminesforitselfhowitshould
bedecomposed. Modesmixintwodifferentways: a)theeigenvectorschangeinspaceandtime,
and b)each modeinfluences theothermodeduetothenon-linearity.
Exercise: In Section 2.6 we derived the set of eigenvectors and eigenvalues for the pertur-
→
bationequationofhydrodynamicswithanadiabaticequationofstate. IfwereplaceγP /ρ
0 0
with the isothermal sound speed c2, then we obtain the results for isothermal waves. The
s
funny thing is, however, that the Jacobain matrix in that case (Eq. 2.23) does not appear to
bethelinearizedformoftheJacobianmatrixderivedinthepresentsection(theoneusedin
Eq. 2.64). ExplainthisintermsofhowthelinearizationisdoneinSection 2.6.
2.15 Non-isothermal hydrodynamic equations
Now let us turn to the generalization of the isothermal hydrodynamics equations: the non-
isothermalhydrodynamicsequations. Notethat thisisnot equal totheadiabatichydrodynamics
equations, because the adiabatic hydrodynamics equations assume that all of the gas lies on the
same adiabat, or in other words: that the gas is isentropic. In constrast, we would now like to
relax any assumptionoftheentropyofthegas, and allowtheentropy ofthegasto vary arbitrar-
ily in space. This means necessarily that we mustincludea third equation: the energy equation.
Nowtheequationsbecomesignificantlymorecomplex.
Wehavenow:
∂ ρ+∂ (ρu) = 0 (2.67)
t x
∂ (ρu)+∂ (ρu2 +P) = 0 (2.68)
t x
∂ (ρe )+∂ [(ρe +P)u] = 0 (2.69)
t tot x tot
Let usdefine
q ρ , q ρu , q ρe (2.70)
1 2 3 tot
≡ ≡ ≡
Then wecan writetheaboveequationsas
q f
1 1
∂ q +∂ f = 0 (2.71)
t 2 x 2
   
q f
3 3
   
inwhich
q
f ρu 2
 f f 1 2 3  =  (ρ ρ e t u o 2 t + + P P )u  =   (γ γ − q3 q 1 1 q2 )q + 3 + 1 (cid:0) − 2 3 γ − 2 γ q q (cid:1) 1 2 2 3 q q 2 1 2   (2.72)
   
whereweused  
(cid:0) (cid:1)
u = q /q (2.73)
2 1
q2
P = (γ 1) q 1 2 (2.74)
− 3 − 2q
(cid:18) 1(cid:19)
Eq.2.71 withtheaboveexpressionsfor(f ,f ,f ) can bewritten withtheJacobian:
1 2 3
0 1 0
q q
∂ q 1 + γ−3q2 2 (3 γ)q2 (γ 1) ∂ q 1 = 0 (2.75)
t  q 2 3   − γq q 3 1 2 q2 + 2 ( q γ 1 − 1) q q 1 2 3 3 γ q q 1 3 + − 2 3(1 − q1 γ) q q 2 1 2 2 γ − q q 1 2   x  q 2 3 
   
 n o n o 

## 페이지 13
35
It can beusefulto rewritetheJacobianusingtheprimitivevariables:
q 0 1 0 q
1 1
∂ q + γ−3ρu2 (3 γ)u (γ 1) ∂ q = 0
t  2   2 − −  x  2 
q γe u+(γ 1)u3 γe + 3(1 γ)u2 γu q
3 −{ tot − } tot 2 − 3
      (2.76)
(cid:8) (cid:9)
Theeigenvaluesare
λ = u C (2.77)
− s
−
λ = u (2.78)
0
λ = u+C (2.79)
+ s
(2.80)
witheigenvectors:
1
e = u C (2.81)
− s
 − 
h C u
tot s
−
 
1
e = u (2.82)
0
 
1u2
2
 1
e = u+C (2.83)
+ s
 
h +C u
tot s
 
where h = e + P/ρ is the total specific enthalpy and C = γP/ρ is the adiabatic sound
tot tot s
speed.
p
2.16 Traffic flow equations
As already mentioned, hyperbolicequations are more general than only the equations of hydro-
dynamics. Here is an example of a model of traffic flow, as was first discussed in papers by
Lighthill,Whithamand Richards ( for the references, see book LeVeque from which this exam-
ple is taken). Let us assume a single lane road with a density of cars q (the number of cars per
car length). We assumethat 0 q 1 (becausewe cannot havemorethan1 car per car length)
≤ ≤
and weverifya-posterioriifthisconditionis satified. Theconservationequationis:
∂ q +∂ (qu) = 0 (2.84)
t x
where u is the speed of the cars at time t and position x. Suppose that there is a speed limit of
u andthatiftheroadisnearlyempty,thecarsdriveatthespeedlimitu = u . Ifthiswasall,
max max
thentheadvectionequationsimplymovesthedensityofcars linearlytowardlargerx. However,
iftheroad gets morecrowded driversnaturallyslowdown. Letus forsimplicityassumethat
u(q) = u (1 q) (2.85)
max
−
Theflux ofcars isthen
f = q(1 q)u (2.86)
max
−

## 페이지 14
36
The flux of cars is greatest when q = 1/2. For lower q the flux is lower because the density
of cars is lower, while for higher q the flux is lower because the speed of the cars goes down
(congestion).
Wecan nowwritethetrafficflow equationas
∂ q +u (1 2q)∂ q = 0 (2.87)
t max x
−
Thisshowsthatthecharacteristicvelocityofthesystemis:
λ = u (1 2q) (2.88)
max
−
which can range from u to u . It is very important to note here that the characteristic
max max
−
speedisnotequaltothespeedofpropagationofthecars! It isthespeedat whichinformationis
propagating, not the speed of the advected quantity q itself. This is one of the peculiar features
of non-linear hyperbolic equations, and it is very similar to the peculiarities of the Burger’s
equation. The traffic flow equation is a particularly nice example of a non-linear hyperbolic
equationbecauseit isaverysimpleequation,yet hasvery interestingsolutionproperties.
2.17 Hyperbolic equations in 2-D and 3-D
So far we have done everything only in 1-D. But what we learned can also be generalized to
higherdimensions,by useoftheconcept ofoperatorsplitting. In 2-D weget
∂ Q+∂ F(Q)+∂ G(Q) (2.89)
t x y
whichcan bewrittenas:
∂f ∂g
i i
∂ q + ∂ q + ∂ q (2.90)
t i x k y k
∂q ∂q
k k
By operatorsplittingwecan focus our attentionto oneof thespace dimensionsonly. If wesplit
itas
∂f ∂f
i i
∂ q + ∂ q = ∂ q (2.91)
t i x k y k
∂q −∂q
k k
then we focus on the advection in x-direction, and consider the y-advection as a source term,
whileifwewrite
∂f ∂f
i i
∂ q + ∂ q = ∂ q (2.92)
t i y k x k
∂q −∂q
k k
we focus on advection in y-direction and consider the x-direction as a source term. In numer-
ical methods this operator splitting is often done to reduce the full 2-D or 3-D problem into
consecutive1-D problemswhichare mucheasierto handle.
