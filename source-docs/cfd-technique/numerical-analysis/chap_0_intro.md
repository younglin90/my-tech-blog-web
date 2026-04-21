# chap_0_intro

> 원본: `numerical-analysis/chap_0_intro.pdf` (0.0MB, 4 페이지 추출)

## 페이지 1
1
Lecture Numerical Fluid Dynamics:
Lecturegivenby
C.P. Dullemond
and
R. Kuiper
CoursegivenatHeidelberg University
Summersemester2008

## 페이지 2
2

## 페이지 3
About the lecture
Introduction
Thetopicofhydrodynamicsorfluiddynamicsdescribesthetime-dependentorstationaryflowof
fluidsorgases. Thenameoriginatesfromfluidflow(hencethenames’hydro’and’fluid’),butin
physics this name is also used to describe gas flows, and in astrophysics it is nearly exclusively
used inthatway.
Hydrodynamicsisa topicthat isoffundamental importanceto manyapplicationsin indus-
try. For instance, it is used to model the flow around airfoils and entire airplanes, the aerody-
namics of sports cars, how water flows through pipes and ducts, the aerodynamic stability of
constructions, complex combustion processes in chemical reactors, etc. It also plays an impor-
tant role in many scientific studies, for instance in meteorology and climate research (modeling
ocean and air currents and the formation of weather fronts) and in astrophysics where it is used
for practically all topics: star- and planet formation, the formation of galaxies, the formation
of structre in the early universe, the accretion of gases onto black holes and neutron stars, the
collidingwindsofevolvedstars etc.
In practically all applications the problems are already so complex that analytical methods
are inadequate. The solution is almost always sought using numerical methods, which, imple-
mented in computer programs, can give numerical solutions for given intial- and or boundary
conditions.
Thislectureaimsto givean introductiontothesenumericalmethods. Wewillfocus on:
• Gaining an understanding of the mathematical properties of the equations of hydrodynam-
ics, whichunderlymanyofthealgorithmstosolvethem.
• Gaininganunderstandingofthemethods,howandwhytheyworkandwhattheirlimitations
are.
• Hands-on experiments(inthepracticum)byself-madeprogramsforsimpleproblems
• Hands-on experiments with some off-the-shelf programs for more complex and realistic
problems
• Exampleapplicationsofthemethods,andtheirbackground.
Various methods
There is no single numerical recipe for all hydrodynamic problems. For instance, for modeling
weather patterns on Earth one requires methods than can handle the strong contrast of distance
scalesintheatmosphere,wheretheverticalheight(roughly20km)ismuchlessthanthesizeof
a typical depression (1000 km). The problem of flow around airfoils (=wings) typically require
methods that have their grids adapted to the wing-shape. In astronomy one typically has 3-D
flows of interstellar gas which can be extremely supersonic (involving very strong shocks) and
can have extreme density contrasts (factors of a million) and spatial scales differing by similar
3

## 페이지 4
4
factors. In other applications one may have more interest in detailed steady-state flows which
are best solved using special-purpose potential solvers. In some cases a detailed treatment of
turbulenceis required, whichagainputsdifferent constraintson thenumerical methodsused.
Also,eachproblemmayinvolvedifferentadditionalphysics. Forinstance,astrophysicalhy-
drodynamicsusuallyinvolvestheinteractionbetweengasandaradiationfield. Thisrequiresthe
combined hydrodynamicand radiative transfer equations to be solved. This is called radiation-
hydrodynamics, and is so complex that in many applications it is still in its infancy. Also in
astrophysics magnetic fields play a crucial role: gas motions can generate (or at least amplify)
magneticfieldsthroughdynamoactionandthesefieldscanstronglyaffectthemotionofthegas.
Anexampleofthisisthemagnetosphereofthesun,wheresolareruptionsareclearlyaninterplay
betweengasandmagneticfields. Thisiscalledmagneto-hydrodynamics,andisafieldofapplied
mathematics that is still under development. In meteorology, in addition to the interaction with
radiation from the sun, the air currents are affected by the evaporation and condensation of wa-
ter, and the precipitation that follows from this. Moreover, in this case the coriolis forces by the
Earth’srotationare ofcrucial importance,too.
In this lecture we put the main focus on normal hydrodynamics with simple source terms
such as gravity. We will focus mostly on grid-based methods for time-dependent fluid flows.
However,there willbe anumberof excursionsaway from that main line, so as to givea tasteof
themorecomplexversionsofhydrodynamicstudy.
Literature
Thislectureisinspiredby,and partiallyfollows,thefollowingbooks:
• Randall J. LeVeque, ”Finite VolumeMethodsfor HyperbolicProblems”(Cambridge Texts
in AppliedMathematics)
• Bodenheimer, Laughlin, Rozyczka and Yorke, ”Numerical Methods in Astrophysics: An
Introduction”(Series inAstronomyand Astrophysics,Taylorand Francis)
• Toro, E.F. ”Riemann Solvers and Numerical Methods for Fluid Dynamics” (Springer Ver-
lag)
• Collelaand Puckett,”Modern NumericalMethodsforFluidFlow”
• Liepmann,H. W.and Roshko, A.,”ElementsofGas Dynamics”(DoverPublications)
• Ferziger, J. H. and Peric, M, ”ComputationalMethods for Fluid Dynamics”(Springer Ver-
lag)
