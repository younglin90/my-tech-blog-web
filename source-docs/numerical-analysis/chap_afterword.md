# chap_afterword

> 원본: `numerical-analysis/chap_afterword.pdf` (0.0MB, 2 페이지 추출)

## 페이지 1
Chapter 11
Afterword
Now that this lecture is over, here are a few words of thought. In this lecture we have discussed
various numerical techniques for solving hydrodynamics problems. For simplicity we have fo-
cused mainly on 1-D, but we have seen that such 1-D techniques (for cell-centered algorithms)
areeasilygeneralized to2-Dand 3-D.In principlethisknowledgeallowsyoutowriteyourown
3-D hydrodynamics solver for Cartesian coordinate systems. The question is, of course, should
you? There are numerous ready-to-use codes on the web for doing numerical hydrodynamic
simulations which include much physics such as (self-)gravity, magneto-hydrodynamics, radia-
tivetransferetc,andnumericalsophisticationsuchasAdaptiveMeshRefinement. Eachofthese
codeshasitsownadvantagesanddisadvantages,anditrequiressome“shoppingaround”tofind
the right code for the purpose you have. The main advantages of using ready-to-use codes are
thatthisa)savesenormousamountsofdevelopmenttime,b)givesyouacodethatislikelytobe
well-tested,c)optimizedinspeed,d)providesmanyoptionsthatmaybetoocomplextodevelop
yourself (such as AMR), e) does not require you to know all the intricate details of such codes
and finally f) ususally provides you with a user group whom you can ask question to. Usually
these arguments are enough to make the decision clear to use ready-to-use codes. However the
black-boxuseofsuch codes can be highlydangerous. A reasonableknowledgeofwhat goeson
inside is important in order to know what you are doing. This lecture was meant to convey this
knowledge.
However, I would also like to say a word of caution. The fact that codes have been around
for many years does not mean at all that they are bug-free. There will always be corners of
parameter space in which these codes were not well enough tested and in which bugs are still
present. If you have a bit more than just a standard purpose for a code you are likely to treat
intonewterritory wherethecodecould produceunpredictableand untestedbehavior. Onemain
advantage of writing one’s own code is that one knows exactly where the code has been tested
and where not. One also knows very well what the behavior of the code is because one has
necessarily spent months if not years to develop the code. Developing your own code costs
enormous amoounts of time and in general a bit more knowledge than that which has been
showninthislecture.
All in all it appears that for most purposes it would be best to use an off-the-shelf code,
but use it with great caution and spend weeks if not months just to test the behavior of the code
against various test problems, someof which have been publishedin scientific papers, others of
whichareanalyticsolutions(e.g.theSodshocktubeproblem)andagainothersaredescribedon
web sitesoffamouscodes.
Here isalistofsomewell-knowncodes used inastrophysics(no claimtobecomplete!!):
155

## 페이지 2
156
FLASH code: http://flash.uchicago.edu/website/home/
Major project for 3-D Cartesian hydro, many modules, AMR, parallelization, large user
base etc. Specialized for conflagration problems (supernova explosions etc). This project
is financed by the Department of Energy (DOE), meaning that it originates from nuclear
weapons research.
PENCIL code: http://www.nordita.org/software/pencil-code/
WidelyusedMHDcodeforCartesiancoordinatesfeaturingahigherorderadvectionmethod.
Mainly used for shearing box calculations of turbulence in protoplanetary disks, but also
used forglobalsimulationsofdisksorotherobjects. Parallelized.
ZEUS code: http://www.astro.princeton.edu/ jstone/zeus.html
One of the most famous (M)HD codes in astronomy, written by Jim Stone. Very widely
used classical solver. It uses a staggered grid, can be used in various coordinate systems
(cartesian, cylindrical, polar), features gravity, self-gravity and radiation transfer. Perhaps
oneofthemostflexibleallroundastrophysicscodes for(magneto)hydrodynamics.
PLUTO code: http://plutocode.to.astro.it/
A versatile Riemann solver code for HD and MHD with AMR capabilities. Parallelized
withMPIA. Curvillinearcoordinatessupported. Also relativisticflowssupported.
ATHENAcode: http://www.astro.princeton.edu/ jstone/athena.html
Stone’s new code based on various types of Riemann solvers (including also Roe’s algo-
rithm). FornowthiscodecanonlydoCartesian coordinates(thoughapparentlyamodefor
cylindrical and polar coordinates is being developed). It features MHD, AMR, paralleliza-
tion(MPI) etc.
GADGET code: http://www.mpa-garching.mpg.de/gadget/ A well docu-
mentedSPH and N-bodycodeforastrophysicalapplications. Hasa largeuserbase.
Keep also in mind that there are a great number of well-tested codes that are not publically
available,butare availableuponrequest (orincollaborationwith)theauthorofthatcode.
So all thatremainsnowis tosay: havefun and successwithnumerical hydrodynamics!
