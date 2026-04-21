# chap_5_numhyd_classic

> 원본: `numerical-analysis/chap_5_numhyd_classic.pdf` (0.5MB, 22 페이지 추출)

## 페이지 1
Chapter 5
Classic hydrodynamics solvers
5.1 Basic approach
Armed with the knowledge on how to numerically advect functions over a grid, we can now
start to build our first numerical hydrodynamics solvers. The knowledge of the structure of
hyperbolic equations described in chapter 2 would lead us to want to diagonalize the system
of equations locally and then apply the numerical advection schemes. This is in fact precisely
what approximate Riemann solvers do (see Chapter ??). But historically the equations were
approachedinasomewhatdifferentmanner,andthosemethodsalsohavesomeadvantagesover
theRiemannsolversoflaterchaptersand forthatreason are stillheavilyin usetoday. Themain
termintheEulerequationsthattendstomixtheeigenvectorsoftheJacobian(andthusmakesthe
problemnotgloballydiagonalizable)isthe∇P term. Ifweextractthistermfrom theleft-hand-
side of the momentum equation and put it to the right-hand-side, then the equation becomes an
advection equation of momentum with advection velocity u. A similar trick can be done with
theenergy equation. Theresultis:
∂ ρ+∇·(ρ~u) = 0 (5.1)
t
∂ (ρ~u)+∇·(ρ~u~u) = −∇P (5.2)
t
∂ (ρe )+∇·(ρe ~u) = −∇·(P~u) (5.3)
t tot tot
The right-hand-side can be regarded as a source term. If we now regard ~u at any time step as
a given quantity of the previous time step, then the left-hand-side of the above set of equations
is already in globallydiagonal form with three equal eigenvalues: λ = u for the x-direction
1,2,3
and λ = v for the y-direction and λ = w for the z-direction. The advection now has
1,2,3 1,2,3
to be done in ρ, ρu, ρv, ρw, and ρe, all with the same advection velocity: these are five fully
independentadvectionproblems. Thisis whatis sometimescalledconsistenttransport.
Thereareanumberofadvantagesofthisapproachoverthefullcharacteristicapproachwe’ll
coverin Chapter ??. One of the main advantages of this approach is that the advection problem
ismuchsimplerthaninthecasewhenwediagonalizethefullJacobianwithgaspressure. Infact,
theaboveapproachisverysimilartoBurger’sequation,butwithsourceterms. Thesourceterms
take care of the pressure forces and adiabatic compression/expansion of the gas. One can now
applyastandardadvectionroutinefortheadvectionofconservedscalarfunctions(seeChapters
3 and 4) to all hydrodynamic conserved quantities ρ, ρu and ρe , and at the end of each time
tot
stepadd thesourcetermstothemomentum-and energy equation.
Apart from the fact that this is easy to do, another advantage of this is that one can apply
algorithmsofarbitraryhighorder. Ofcourse,thishigh-orderadvectiononlyappliestofluidmo-
73

## 페이지 2
74
tion and not to the sound waves, so the high-precision advection does not make the propagation
of sound waves more accurate in this approach. But for very sub-sonic flows the propagation
of sound waves is anyway of lesser interest, and the fluid motions are then anyway the most
important flow patterns, which can thus be advected with any precision one likes by choosing
the right advection algorithm. If the gradient of the pressure (i.e. the source term on the rhs of
the momentum and energy equations) is also evaluated with a higher-order accurate derivative,
thentheentirealgorithmcan bemadehigherorder.
A final advantage of this approach is that hydrostatic solutions of fluid flows with external
body forces can be easily ‘recognized’ by the algorithm. This is because all forces are handled
as source terms on the right-hand-side of the equations. In equilibrium all these forces cancel
exactly, and will not produce numerical disturbances to the advection part of the equation. This
approach is very well suited for problems that are near some hydrostatic equilibrium, such as
planetary atmospheresorfluid motionsina rotatingsystem.
5.2 A simple 1-D hydrodynamics algorithm
Let us jump right into making an algorithm, but let us do this for the moment for a simplified
case: theproblemof1-Disothermalhydrodynamics. Thetwoconservedquantitiestoadvectare
q = ρ and q = ρu. The pressure is P = ρc2 where c2 is a global constant. The equations to
1 2 s s
solveare:
∂ q +∂ (q u) = 0 (5.4)
t 1 x 1
∂ q +∂ (q u) = −∂ P (5.5)
t 2 x 2 x
5.2.1 The algorithm
Wewillapproach thisusingoperatorsplitting:
1. Firstwe dotheadvectionwithoutsourceterm,
q n+1/2 = qn −∆t∂ (qnu) (5.6)
1 1 x 1
q n+1/2 = qn −∆t∂ (qnu) (5.7)
2 2 x 2
2. Then wewilladdthesourceterm:
qn+1 = q n+1/2 (5.8)
1 1
qn+1 = q n+1/2 −∂ Pn+1/2 (5.9)
2 2 x
wherePn+1/2 = q n+1/2 c2.
1 s
For the advection, let us for the moment simply choose the donor-cell algorithm. The q and q
1 2
are located at thegridcell centers, sothat wehaveq and q with0 ≤ i ≤ N −1. To produce
1,i 2,i
an advective flux at the cell interfaces, we need to calculate first the cell interface value of the
velocity. Wedo thissimplybyaveragingthevelocityoverthetwoadjacent cells:
1 q q
u = 2,i + 2,i+1 (5.10)
i+1/2
2 q q
(cid:18) 1,i 1,i+1(cid:19)

## 페이지 3
75
Then wedefinetheflux:
qn u for u > 0
f = 1,i i+1/2 i+1/2 (5.11)
1,i+1/2 qn u for u < 0
(cid:26) 1,i+1 i+1/2 i+1/2
and thesameforf . Weupdateq as
2,i+1/2
q n+1/2 = qn −∆t f 1,i+1/2 −f 1,i−1/2 (5.12)
1,i 1,i x i+1/2 −x i−1/2
and the same for q n+1/2. This is the donor-cell advection. The qn+1/2 does not mean that we do
2,i
the advection for only half a time step. It only means that, by operator splitting, we still have
anotheroperatortogo.
Forthissecondoperator, theadditionofthesource, wesimplytaketheapproximation:
∂P P n+1/2 −P n+1/2 ρ n+1/2 −ρ n+1/2
→ i+1 i−1 = c2 i+1 i−1 (5.13)
∂x (cid:12)i x i+1 −x i−1 s x i+1 −x i−1
(cid:12)
(cid:12)
and weperform thefollowingupdate, thistimeonly forq
(cid:12) 2,i
ρ n+1/2 −ρ n+1/2
qn+1 = q n+1/2 −c2 i+1 i−1 (5.14)
2,i 2,i s x i+1 −x i−1
In principlethisis it, butwe musttakespecial care at theboundary. We mustdecide which
kind of boundary condition to take. In Section 5.3 we shall go into more detail, but for now let
us assume a reflective boundary condition in which the advective velocities at the left interface
of the left boundary cell and the right interface of the right boundary cell are assumed to be
zero, and in which the pressure outside of the domain is assumed to be equal to the pressure
in the boundary cell. If i = 0 is the first cell, and i = N − 1 is the last cell, then we write
u−1/2 = u N−1/2 = 0 for the advection. For the pressure source term in themomentumequation
wetake(onlytheleft boundaryconditionas an example;right goessimilar):
1 ρ n+1/2 −ρ n+1/2
qn+1 = q n+1/2 − c2 1 0 (5.15)
2,0 2,0 2 s x −x
1 0
The factor 1/2 comes in because actually the ∆x = x
1
−x−1 , but since without ghost cells x−1
does not exist, we do it with a factor 1/2. Note, then, that ghost cells may indeed be handy. We
willusethemlater.
5.2.2 The computer implementation
For the computer implementation we must first identify the indices of the interfaces, because a
computer cannot address i + 1/2 in an array. As usual we always take the interface to be left
of the cell with the same number: u i−1/2 ≡ u[i]. We make an array of N values for q 1 ≡ ρ
and q ≡ ρu, and any interface quantities will be arrays of N + 1 values, starting with the left
2
interfaceoftheleftmostcell and endingwiththerightinterfaceoftherightmostcell.
Nowlet uscreate asubroutinefordoingonesingletimestep ofthehydrodynamics:
pro hydroiso_cen,x,xi,rho,rhou,e,gamma,dt
nx = n_elements(x)

## 페이지 4
76
;
; Compute the velocity at the cell interfaces
;
ui = dblarr(nx+1)
for ix=1,nx-1 do begin
ui[ix] = 0.5 * ( rhou[ix]/rho[ix] + rhou[ix-1]/rho[ix-1] )
endfor
;
; Compute the flux for rho
;
fluxrho = dblarr(nx+1)
for ix=1,nx-1 do begin
if ui[ix] gt 0. then begin
fluxrho[ix] = rho[ix-1] * ui[ix]
endif else begin
fluxrho[ix] = rho[ix] * ui[ix]
endelse
end
;
; Update the density
;
for ix=0,nx-1 do begin
rho[ix] = rho[ix] - (dt/(xi[ix+1]-xi[ix]))*$
(fluxrho[ix+1]-fluxrho[ix])
endfor
;
; Compute the flux for rho u
;
fluxrhou = dblarr(nx+1)
for ix=1,nx-1 do begin
if ui[ix] gt 0. then begin
fluxrhou[ix] = rhou[ix-1]ˆ2 / rho[ix-1]
endif else begin
fluxrhou[ix] = rhou[ix]ˆ2 / rho[ix]
endelse
end
;
; Update the momentum
;
for ix=0,nx-1 do begin
rhou[ix] = rhou[ix] - (dt/(xi[ix+1]-xi[ix]))*$
(fluxrhou[ix+1]-fluxrhou[ix])
endfor
;
; Compute the pressure
;
p = (gamma-1.d0)*rho*e

## 페이지 5
77
;
; Now add the pressure force, for all cells
; except the ones near the boundary
;
for ix=1,nx-2 do begin
rhou[ix] = rhou[ix] - dt*(p[ix+1]-p[ix-1])/(x[ix+1]-x[ix-1])
endfor
;
; Now do the boundary cells, assuming mirror
; symmetry in the boundaries
;
rhou[0] = rhou[0] - 0.5*dt*(p[1]-p[0])/(x[1]-x[0])
rhou[nx-1] = rhou[nx-1] - 0.5*dt*(p[nx-1]-p[nx-2])/(x[nx-1]-x[nx-2])
;
; Done
;
end
This contains everything we discussed above: the advection, the computation of the new pres-
sure, theimplementationoftheboundary conditions.
Nowlet usdefine atestproblem.
nx = 100
nt = 1000
x0 = 0.d0
x1 = 100.d0
xmid = 0.5 * (x0+x1)
dt = 0.25
cfl = 0.5
x = x0 + (x1-x0)*(dindgen(nx)/(nx-1.d0))
gamma = 7./5.
rho = dblarr(nx,nt+1)
rhou = dblarr(nx,nt+1)
e = dblarr(nx)+1.d0
time = dblarr(nt+1)
dg = 0.1*(x1-x0)
rho[*,0] = 1.d0+0.3*exp(-(x-xmid)ˆ2/dgˆ2)
Andproducethexiarray whichis needed, aswell as adxarray.
;
; Now some additional arrays are set up
;
xi = dblarr(nx+1)
xi[1:nx-1] = 0.5 * ( x[1:nx-1] + x[0:nx-2] )
xi[0] = 2*xi[1] - xi[2]
xi[nx] = 2*xi[nx-1] - xi[nx-2]
dx = ( xi[1:nx] - xi[0:nx-1] )

## 페이지 6
78
Figure5.1. Thedensityasafunction ofspacexandtimetwithinitialcondition ofagaussian
perturbation, solvedwiththesimplefirst-orderhydrodynamics algorithm ofSection5.2.
We now want to compute 1000 time steps of the hydrodynamics. We must recompute the
smallestallowed∆teachtimestep. WedefineadimensionlessCourantnumberwhichtellshow
muchsmallerthan theformalmaximumwewishto takethetimestep. Andherewego:
;
; Now the hydro is done
;
for it=1,nt do begin
qrho = rho[*,it-1]
qrhou = rhou[*,it-1]
cs = sqrt(gamma*(gamma-1)*e)
dum = dx/(cs+abs(qrhou/qrho))
dt = cfl*min(dum)
time[it] = time[it-1]+dt
;;
print,’Time step ’,it,’, Time = ’,time[it],’, Dt = ’,dt
;;
hydroiso_cen,x,xi,qrho,qrhou,e,gamma,dt
;;
rho[*,it] = qrho
rhou[*,it] = qrhou
endfor
The results are shown in Fig. 5.1. It is seen that the Gaussian blob in the density splits up in a
left- and a right-moving blob, which both reflect off the walls of the domain and return toward
thecenter ofthedomain. By that time,duetothenon-linearityoftheequationsand thestrength
of the pertubation (30% of the background value), the wave has steepened into something that
looks like a shock, but is still spread over multiple cells. This wave pattern repeats many times
and the shock front steepens, but still remains smeared over a number of cells. Nevertheless, it
seemsthat wehaveproduced ourfirst succesfulhydrodynamicscode.

## 페이지 7
79
Figure5.2. SameasFig.5.1,but nowusing always thestart-of-the-time-step variables forthe
updateofthestate. Anumericalinstability appears.
5.2.3 The order ofevaluationmatters...
The above exercise may have not seemed too difficult. But still we only have a first order algo-
rithm and of course we have been lucky that we have not fallen into the many pitfalls that can
exist. One possible problem appears if the order of the evaluations is done in a different way.
Suppose that the evaluationof thepressure is donebefore theadvection of the density. In effect
wethen get
ρn −ρn
qn+1 = q n+1/2 −c2 i+1 i−1 (5.16)
2,i 2,i sx
i+1
−x
i−1
instead of Eq. 5.14. This is only a very minor change in the algorithm. It simply means that
we use thevalues at thestart ofthe timestep for any of the operations we do (advection, source
addition). It maynotseem as amistake,butFig. 5.2showstheresult. In thebeginningthewave
propagates in the way that was expected, but soon a serious instability appears and wrecks the
entiresolution. Thisshowsthatwhen sourceslikethepressuresourceareadded, atrueoperator
splittingisrequired: firsttheadvection,thenrecomputethepressurefromthenewvariables,and
thenadd thepressuresource.
5.3 Boundary conditions, ghost cells
Wehaveseenalreadyinchapter4thattheuseofghostcellsattheboundariescanbeveryuseful
to easily implement boundary conditions. There are a number of different kinds of boundary
conditionsonecan installinthisway. Hereisalistofcommonones(wherewemainlyfocuson
theleftboundary).
1. Periodicboundaryconditions: ρ[0] = ρ[N ],u[0] = u[N ](andsimilarlyρ[N +1] = ρ[1],
x x x
u[N +1] = u[1]).
x
2. Reflectiveboundaryconditions: ρ[0] = ρ[1], u[0] = −u[1].
3. Free outflow/inflow: ρ[0] = ρ[1], u[0] = u[1].
4. Free outflow,no inflow: ρ[0] = ρ[1], u[0] = −abs(u[1]).

## 페이지 8
80
5. Given-stateboundarycondition: ρ[0] = ρ (t), u[0] = u (t).
l l
and similar for the right boundary. In 2-D and 3-D hydrodynamics these types of boundary
conditionsare thesame, butthenincludingalsotheothertwo velocitycomponents.
Periodic boundary conditions have many uses. First of all, sometimes the system we wish
to model is clearly periodic (such as if we wish to model the atmosphere of the Earth where
going East eventually brings you back where you came from). But also for other applications
can periodic boundary conditions be useful: if we wish, for instance, to model the nature of
turbulence, then we are anyway interested in flow patterns with scales that are much smaller
than the computational domain. But we do wish to ensure that there are no artificial damping
or forcing effects caused by imposing some arbitrary boundary condition. A periodic boundary
condition basically removes beforehand any artificial boundary effects because the turbulence
can now not feel the boundary at all. The only way that the turbulence can ’feel’ the fact that
the computational domain is limited is that it cannot grow modes larger than the size of the
computationaldomain.
Reflective boundary conditions are also very often used. The advantage is that no mass
nor energy can flow off the grid. Energy and mass are therefore globally conserved, or in other
words: thesystemisclosed. Therearenoexternalinfluencesthatmayaffectthesolutionbecause
theproblemis perfectly self-contained. A disadvantageofreflectiveboundary conditionsis that
any waves that are spawned by the interesting part of the flow pattern that we are modeling are
also perfectly reflected, and typically return to the area of interest and start interfering with that
area. For instance, if we want to model how a rotating irregular body in a volume of gas stirrs
waves and how these waves transport away energy and damp the rotation of the body, then the
reflective boundary conditions bring back the waves to the body and start affecting its motion.
Thisisthen clearly undesired.
A free outflow/inflow boundary condition has the advantage that any waves that are pro-
duced in the model are simply advected off the grid. The waves do not return anymore. This
is clearly desirable in many cases. But the problem is that if for some reason the velocity u[1]
becomes inflowing (u[1] > 0), then the state at cell i will determine the influx of matter. This
can typically cause completely arbitrary influx of matter. One can see why this is the case: one
of the two characteristics is pointing inward into the grid (λ = u + c ). So there is always in
+ s
inflowof informationintothegrid. But ifthestateintheghostcell is purely givenas afunction
of the state at i = 1, then the state at i = 1 determines itself what kind of information it wishes
to receive from grid point i = 0 (ghost cell) through that characteristic. Clearly this is unphysi-
cal because the inward-pointing characteristic (λ = u+c ) should transport information only
+ s
toward positive x and never receive any information from larger x. This boundary condition is
therefore quite dangerous. Only if we have a supersonic outflowing motion toward this bound-
ary can webesurethat thisboundaryconditionwillnevercause problems. Thereason is that in
the case of supersonic outflow both characteristics point out of the grid: λ− = u− c
s
< 0 and
λ = u+c < 0. Thenbycopyingthestatetotheghostcellnoinformationispropagatedinthe
+ s
upstreamdirection.
The outflow-but-no-inflow condition is an attempt to solve the problem of arbitrary inflow
in subsonic cases. It clearly does not allow unphysical inflow of matter, but it allows matter to
flow off the grid. It is, so to speak, a sink. It is not ideal, because there is still the problem of
propagating information upstream, but if the goal of imposing this boundary condition is to get
rid ofany matterthan comesneartheboundary,thenthisissometimesused.

## 페이지 9
81
With the given-state boundary condition one can do many things. For instance, one can
force waves, or impose some influx of matter at the boundary. However, with this method this
does not always work. Suppose we impose an influx of f = ρ[0] ∗ u[0] = 1 at the boundary
by putting ρ[0] = 1, u[0] = 1, but the state in the modeling domain is ρ[1] = 1000, u[1] = 1.
We may think that we imposed f = 1 at the boundary, but instead the pressure in cell 1 is
completely overwhelming the pressure in ghost cell 0, and a negative flux of matter will result.
So the imposed-state boundary condition works only if the influx has a momentum flux that
clearly overcomes the pressure in the modeling domain. We could, instead, decide to impose a
flux at boundary i = 1/2, i.e. the left wall of the boundary cell, and completely skip the ghost
cell approach. Thatwouldallowaperfect andstrict impositionofaflux. A disadvantagehere is
thatonedoes notknowifthisflux is physicalinthissituation.
5.3.1 Ghostcells forschemes witha 5-pointstencil
A single ghost cell on each boundary is sufficient if the stencil of the advection scheme is sym-
metric and 3-point. For linear advection schemes such as Donor-cell and Lax-Wendroff this is
thecase. However,someotherschemessuchasBeam-warmingorFrommrequire,fortheupdate
atpointialsoinformationofthecellsati±2inadditiontothei±1points. Also,whentheflux
limiter method is used with a non-linear flux limiter recipe, then often the i±2 are used. Such
schemesarethereforeinprinciple5-pointschemes,evenif,foragivenvelocitydirection,only3
pointsareused(i−2,i−1,iori,i+1,i+2)becausewedonotknowa-prioriwhichdirection
the velocitypoints. For such schemes a singleghost cell on each boundary is not sufficient. We
mustimplementadoublelayerofghostcells. Forthedirectfluxfromthesecellsintothephysical
domain the first ghost cell (the one next to the physical domain)is of most importance, because
thatisthedonoroftheflux. Butthesecondghostcellwill,inthecaseofflux-limiters,determine
whatthevalueofthefluxlimiteris,andcantherebysignificantlyaffectthesolutionnonetheless.
The implementationofthe boundary conditiongoes, for the rest, similarto thesingle-ghostcell
case.
5.4 Hydrodynamics with ghost cells
So now that we see that ghost cells are extremely useful to implement boundary conditions,
let us start all over again and produce a new algorithm in which two ghost cells are used on
each side. Also, let us implement a standardized advection subroutine which we shall call
advect(), which advects any conserved quantity with a given velocity given at the cell in-
terfaces, and a standardized boundary condition routine boundary() that setst he ghost cells
to the proper values consistent with the kind of boundary condition used. Let us first show
the routine advect(), but note that a more sophisticated version of advect() (with more
choices offlux limiters)willbemadeavailablefortheexercises:
pro advect,x,xi,q,ui,dt,fluxlim,nghost
nx = n_elements(xi)-1
if n_elements(x) ne nx then stop
if n_elements(xi) ne nx+1 then stop
if n_elements(q) ne nx then stop
if n_elements(ui) ne nx+1 then stop
if nghost lt 1 then stop
;

## 페이지 10
82
; Determine the r_{i-1/2} for the flux limiter
;
r = dblarr(nx+1)
for i=2,nx-2 do begin
dq = (q[i]-q[i-1])
if abs(dq) gt 0.d0 then begin
if(ui[i] ge 0.d0) then begin
r[i] = (q[i-1]-q[i-2])/dq
endif else begin
r[i] = (q[i+1]-q[i])/dq
endelse
endif
endfor
;
; Determine the flux limiter
; (many other flux limiters can be implemented here!)
;
case fluxlim of
’donor-cell’: begin
phi = dblarr(nx+1)
end
’superbee’: begin
phi = dblarr(nx+1)
for i=1,nx-1 do begin
a = min([1.d0,2.d0*r[i]])
b = min([2.d0,r[i]])
phi[i] = max([0.d0,a,b])
endfor
end
else: stop
endcase
;
; Now construct the flux
;
flux = dblarr(nx+1)
for i=1,nx-1 do begin
if ui[i] ge 0.d0 then begin
flux[i] = ui[i] * q[i-1]
endif else begin
flux[i] = ui[i] * q[i]
endelse
flux[i] = flux[i] + 0.5 * abs(ui[i]) * $
(1-abs(ui[i]*dt/(x[i]-x[i-1]))) * $
phi[i] * (q[i]-q[i-1])
endfor
;
; Update the cells, except the ghost cells

## 페이지 11
83
;
for i=nghost,nx-1-nghost do begin
q[i] = q[i] - dt * ( flux[i+1]-flux[i] ) / ( xi[i+1] - xi[i] )
endfor
;
end
Now the boundary condition implementation routine, which is only necessary for imposing pe-
riodicboundary conditionsormirrorboundaryconditions,is:
pro boundary,rho,rhou,periodic=periodic,mirror=mirror
;
; Get the number of grid points including the ghost cells
;
nx = n_elements(rho)
;
; If periodic, then install periodic BC, using two ghost cells
; on each side (two are required for the non-lin flux limiter)
;
if keyword_set(periodic) then begin
rho[0] = rho[nx-4]
rho[1] = rho[nx-3]
rho[nx-2] = rho[2]
rho[nx-1] = rho[3]
rhou[0] = rhou[nx-4]
rhou[1] = rhou[nx-3]
rhou[nx-2] = rhou[2]
rhou[nx-1] = rhou[3]
endif
;
; If mirror symmetry, then install mirror BC, using two ghost cells
; on each side (two are required for the non-lin flux limiter)
;
if keyword_set(mirror) then begin
rho[0] = rho[3]
rho[1] = rho[2]
rho[nx-2] = rho[nx-3]
rho[nx-1] = rho[nx-4]
rhou[0] = -rhou[3]
rhou[1] = -rhou[2]
rhou[nx-2] = -rhou[nx-3]
rhou[nx-1] = -rhou[nx-4]
endif
end
Theactual hydrodynamicssubroutinemakesuseoftheaboveroutines. It reads:
pro hydrostep,x,xi,rho,rhou,e,gamma,dt,periodic=periodic,$

## 페이지 12
84
mirror=mirror,fluxlim=fluxlim,nrvisc=nrvisc
;
; Check for conflicting settings
;
if keyword_set(mirror) and keyword_set(periodic) then stop
;
; Use 2 ghost cells on each side
;
nghost = 2
;
; If not defined, install default flux limiter
;
if not keyword_set(fluxlim) then fluxlim=’donor-cell’
;
; Get the number of grid points including the ghost cells
;
nx = n_elements(x)
;
; Impose boundary conditions
;
boundary,rho,rhou,periodic=periodic,mirror=mirror
;
; Compute the velocity at the cell interfaces
;
ui = dblarr(nx+1)
for ix=1,nx-1 do begin
ui[ix] = 0.5 * ( rhou[ix]/rho[ix] + rhou[ix-1]/rho[ix-1] )
endfor
;
; Advect rho
;
advect,x,xi,rho,ui,dt,fluxlim,nghost
;
; Advect rho u
;
advect,x,xi,rhou,ui,dt,fluxlim,nghost
;
; Re-impose boundary conditions
;
boundary,rho,rhou,periodic=periodic,mirror=mirror
;
; Compute the pressure
;
p = (gamma-1.d0)*rho*e
;
; Now add the pressure force, for all cells except the ghost cells
;

## 페이지 13
85
for ix=2,nx-3 do begin
rhou[ix] = rhou[ix] - dt*(p[ix+1]-p[ix-1])/(x[ix+1]-x[ix-1])
endfor
;
; Re-impose boundary conditions a last time (not
; strictly necessary)
;
boundary,rho,rhou,periodic=periodic,mirror=mirror
;
; Done
;
end
Thisroutinemakessuretoalwaysre-implementtheboundaryconditionsfortheghostcells. This
is done without checking which variables have to be updated, so it is a bit inefficient, but it is
safe. Note, also, that in the above routines nx denotes the number of cells including the ghost
cells. Withtheaboveroutinesonecanagaindoexperimentsandseehowthesolutionsbehavefor
differentfluxlimitersandboundaryconditions. Onetrueadvantageoftheaboveimplementation
is that it is now very easy to impose periodic boundary conditions, because we only copy the
statevariablesfromtheleft totherightboundaryand fromtherighttotheleft boundary.
→ Exercise: Implementtheaboveroutinesandcreateasetupwithasoundwavemovingfrom
left to right. Impose periodic boundary conditions. Tip: Make sure that the sine-wave is
suchthatrho[0]=rho[nx-4]andrho[1]=rho[nx-3],sothattheperiodicityofthe
waveisperfect,inthepresenceofthetwoghostcellsoneachside. Describehowthesound
wavesteepens,sheds smallerwavesand formsashock.
5.5 Now including the energy equation
So far we have neglected the energy equation because we assumed that the temperature was
constant at all times. However, most interesting applications do not have this property. We
therefore must include the energy equation, including the work source term due to the pressure
force:
∂ (ρe )+∂ (ρe u) = −∂ (Pu) (5.17)
t tot x tot x
We define a third conserved quantity q ≡ ρe . As in the case of the momentum equation we
3 tot
apply the method of operator splitting here: we first solve the equation ∂ q + ∂ (q u) = 0 for
t 3 x 3
onetimestep,andthensolve(withthenewvariables)theequation∂ q = −∂ (Pu)forthesame
t 3 x
time step. The advection of the total energy is done in exactly the same way as for the density
and themomentum. In fact, wecan likewiseusethesubroutineadvect()forit.
The difficulty lies in the work term −∂ (Pu). First of all we need to calculatethe pressure
x
P fromthethree conservedquantitiesq ≡ ρ, q ≡ ρu and q ≡ ρe . In fact, wealso need this
1 2 3 tot
P for the source term in the momentum equation. The way this can be done is to first compute
thethermalenergy e from thetotalenergy:
th
u = q /q (5.18)
2 1
e = q /q (5.19)
tot 3 1
e = u2/2 (5.20)
kin
e = e −e (5.21)
th tot kin

## 페이지 14
86
Onceweknowthis,wecomputethepressureaccording toP = (γ −1)ρe .
th
Then we use P for both the source term in the momentum equation (the force) and for the
sourcetermin theenergy equation(thework). Fortheformerwewrite
q 2 n , + i 1 −q 2 n , + i 1/2 = − P i+1 −P i−1 (5.22)
∆t 2∆x
whereq n+1/2 denotestheupdateofqn duetotheadvection. Forthelatterwecan write:
2,i 2,i
q 3 n , + i 1 −q 3 n , + i 1/2 = − P i+1 u i+1 −P i−1 u i−1 (5.23)
∆t 2∆x
These new elements can be readily built in into the algorithm of Section 5.4, and this should
produceaworkingalgorithm.
5.5.1 Arethese equations conservative?
As was mentioned in Chapter 4 it can be very important to make sure that conserved quantities
actually remain conserved in the numerical simulation. In the current approach, however, we
have put the pressure force and work to the right-hand-side of the conservation equation, as a
source term. This raises the question: are the equations still conservative? The answer is: in
principleyes,iftheforceandworktermsarewritteninaproperway. Definethemomentumflux
throughinterfacei−1/2tobef p,i−1/2 = 2 1(P i−1 +P i ),andsimilarfori+1/2. Thenweobtain:
qn+1 = q n+1/2 −∆t f p,i+1/2 −f p,i+1/2 = q n+1/2 − ∆t P i+1 −P i−1 (5.24)
2,i 2,i x i+1/2 −x i−1/2 2,i 2 x i+1/2 −x i−1/2
and similar for the energy equation. For a regular grid this becomes equal to the expressions
of Eqs.(5.22,5.23). This shows that implicitly the equations are numerically conservative, even
though we have not explicitly put them in a flux-conserved form. For non-regular gridding one
shouldsticktothepresentlyderivedexpression,sothat flux conservationis guaranteed.
5.6 Shock waves and the Von Neumann - Richtmyer artificial viscosity
We have seen in the examples above that waves tend to steepen and form shocks. Let us take
a closer look, by simulating a true right-moving shock wave and analyzing its behavior. Let us
assume that a shock wave is moving from the left boundary into a non-moving medium. We
can define the Mach number M to be the ratio of the shock speed u to the sound speed C
s s
on the pre-shock medium. Let us call the pre-shock medium the ’right domain’ and the post-
shock region the ’left domain’, because the shock moves from left to right. We therefore define
M ≡ u /C . According to the conservation of density, momentumand energy over the shock
s s,r
(Rankine-Hugoniot)wecan write:
(γ +1)M2
ρ = ρ (5.25)
l r (γ −1)M2 +2
2γM2 −(γ −1)
P = P (5.26)
l r
γ +1
P
u = M γ r (5.27)
s
s ρ r
ρ −ρ
u = u l r (5.28)
l s
ρ
l

## 페이지 15
87
Figure5.3. Theresultofatestproblem withaM = 2shock wavemovingintoanon-moving
mediumofρ= 1,P =0.1,modeledusingadvectionwithasuperbee fluxlimiter.
Thisisthenthestatethatweplugintotheghostcellsontheleftboundary. Itshould,inprinciple,
producea clean shock front movingfrom theleft boundaryto theright. Now let ussee what we
get if we use advection according to the superbee flux limiter for a shock of Mach 2. This is
depicted in Fig. 5.3 What one sees is that in principle the shock wave is well reproduced, but
there are some oscillationsat the shock front. This has a natural explanation. The equations for
the hydrodynamics solver were derived from the continuous Euler equations. These equations
arevalidforsmoothflow,butbreakdownforshockfronts,soweshouldnotexpectthehydrody-
namicssolvertobeabletohandleshocks. Infact,ashockistheonlylocationwherenon-viscous
hydrodynamicscan increasetheentropyofthegasflow. Theway that Naturedoesthisis thatat
verysmallspatialscalesthemolecularviscositybecomesimportant,andthisviscosityproduces
entropy in the shock front. Basically one can say that in Nature the shock front has a small but
non-negligible width L such that the Reynolds number Re= uL is of order unity in this shock
ν
front. Kineticenergy canthenbedissipatedtoheat inthisshock,whichincreasestheentropyof
thegas.
Innumericalhydrodynamicsthegridcellsizeisusuallyordersofmagnitudelargerthanthe
true width of the shock. And the equations that we used for the hydrodynamics solver did not
explicitlyincludeanyentropy-generatingviscosityterms. Thereforeweexpectthatouralgorithm
should produce errors in the flow near the shock front, in particular downstream of the shock
front. The interesting thing is, in fact, that the method already does surprisingly well, given
these thoughts (see, however, Section 5.10.2 for what happens if a different energy equation is
used). Fardownstreamoftheshockfrontthestateisreasonablycorrectandtheentropyincrease,
expectedfrom theshock,isindeed there. So oneshouldask oneselftwoquestions:
1. Whydoesoursolverhandletheshockreasonablywell,eventhoughweneverinsertedany
entropy-generatingviscoustermsbyhand?
2. Howcan wedo better,so thatwedo notget thewigglesbehindtheshock?
To answer question 1, the answer lies in the fact that due to the intrinsic diffusivity of the
advection algorithm, any oscillations are smeared out quickly. The question remains then, how
does the code know how much entropy to generate? This can be traced back to the fact that
the algorithm is in conservativeform. If the post-shock state variables are smoothed out and all

## 페이지 16
88
Figure5.4. AsFig.5.3,butnowwithvonNeumann-Richtmyer artificialviscosity withξ = 3.
oscillationshavegone,thenthereisonlyonesetofstatevariablesconsistentwiththepost-shock
density, momentum and energy flux. So diffusing oscillations out, but keeping the algorithm
perfectlyconservative,mustautomaticallyproducetherightstateandthereforetherightincrease
in entropy compared to the pre-shock state. Diffusion is therefore a good thing in this respect.
In fact, if wewould usethedonor-cell algorithmfor theadvection, which has intrinsicallymore
numerical diffusion, then the post-shock oscillationsare already quitelow. But thedrawback of
donor-cell algorithm is that any flow feature is smeared out. This can therefore not be the final
solution.
To answer question 2: we need to find a way to increase the diffusivity near the shock
front, but not elsewhere. In fact, we can follow a physically motivated path by introducing
an artificial viscosity (as opposed to artificial diffusivity) which sort of mimics the physical
shock viscosity, but then smeared out over a region the size of a few grid cells instead of the
unresolvable true shock width. The most popular artificial viscosity recipe for handling shocks
is the von Neumann-Richtmyer artificial viscosity. This is a bulk viscosity which acts as an
additionalpressure:
Π = 4 1ξ2(u i+1 −u i−1 )2ρ i if u i+1 ≤ u i−1 (5.29)
i 0 if u i+1 > u i−1
(cid:26)
whereξ isatuningparameterwhichspecifiesoverhowmanygridcellsashockshouldbespread
out. It is typically chosen to be of the order of 2 or 3. To implement it in the algorithm one
replaces any instance of the pressure P with P + Π. This takes care of the force as well as the
work done by this bulk viscosity. For the above test problem, the result for ξ = 3.0 is shown
in Fig. 5.4 One sees that the post-shock oscillationshave gone. The penalty is that the viscosity
affects the pre-shock region and the shock is therefore not as sharp anymore as we had before.
Also there is a little dip in the density profile where no dip should be. This has formed in the
very initialphaseas theshockstarted to propagateintothedomain. Sincetheshock as modeled
by the numerical algorithm is not infinitely sharp, the intial conditions were not in agreement
with the “numerical form of the shock”, and startup oscillationswere present. They produced a
bit too much entropy in this region, causing thedensity(for the samepressure) to be a bit lower
thanshouldbe.
Von Neumann-Richtmyer artificial viscosity has the good property that it only becomes
strong when its presence is required, and becomes negligible when the flow is smooth. It is

## 페이지 17
89
therefore much better than the uncontrolled numerical diffusivity of for instance the donor-cell
algorithm. The von Neumann-Richtmyer artificial viscosity, and varieties thereof, is used in a
great manynumericalhydrodynamicscodes.
5.7 Odd-even decoupling
The numerical algorithms we have constructed so far have an interesting problematic property
thatis onlyseldomlyserious,butmightbeusefultokeep in mind.
Suppose we start with a situation in which the velocity is everywhere zero: u(x) = 0. We
assume that the specific thermal energy (∝ temperature) is also constant, for simplicity. Let us
takeit: e (x) = 1. But weletthedensityvaryas a‘sawtooth’profile:
th
1 ifi = 1,3,5,7···
ρ = (5.30)
i 2 ifi = 2,4,6,8···
(cid:26)
ThepressureinthesecellsisthenP = 1fori = 1,3,5,··· andP = 2fori = 2,4,6,···. Soin
i i
principlethe even cells are over-pressurized compared to their neighbors. Physicallythese cells
shouldquicklydepressurizebymovingpartoftheircontenttotheirunder-pressurizedneighbors.
Thisshouldgiveahigh-frequencyoscillation,andwiththeusualnumericalviscositythisshould
then automaticallydamp out. However, for this case the momentumflux through cell interfaces
i−1/2and i+1/2 is
1 1
F i ( − 1) 1/2 = 2 (P i−1 +P i ) F i ( + 1) 1/2 = 2 (P i +P i+1 ) (5.31)
Theupdateofthemomentumat cellcenter iis:
ρn i +1un i +1 = − F i ( + 1) 1/2 −F i ( − 1) 1/2 = − 1 (P i+1 −P i−1 ) = 0 (5.32)
∆t ∆x 2∆x
SobecausetheP cancelsout,theupdateofthemomentumiszero. Thisisalsological,sincethe
i
fluxesofmomentuminbothinterfaces arethesame,andthereforetheirdifferences cancel. This
isapotentialproblembecausethecodeleavestheseoscillationstherewithoutdampingthemout,
i.e.it leavesan unphysicalsolution. In fact, itis fundamentallyimpossibleto solvethisproblem
ifmomentum,densityandpressurearelocatedonthesamegridpoints,unlessartificialdiffusion
isinvoked. Thisphenomenoniscalled odd-evendecoupling.
One sees that the odd-even decoupling does not involve an exponetially growing unstable
mode. Butthereisalsonodamping. Soanynumericalnoiseorothercausesoferrorsmaysimply
get ‘stuck’ in an odd-even mode where they do not get amplified, but they do not get damped
either. Such‘sawtooth’modesareclearlyanunwantedeffect. Onesimplewaytogetridofthem
wouldbediffusion,butthatwouldalsodiffuseoutflowpatternsthatwewishtoresolve. Abetter
way,which alsoautomaticallyincreases theorderofthealgorithm,isto usestaggered grids.
5.8 Staggered grids
A numerical hydrodynamics scheme with a staggered grid places any vectorial components,
suchasthemomentumdensityq ≡ ρu,notonthecellcentersbutonthecellinterfaces. Insuch
2
aschemeonewouldhaveq ≡ ρandq ≡ ρe located atthecellcenters andρu locatedonthe
1 3 tot

## 페이지 18
90
cell interfaces. But since q is also a conserved quantity we must also define a cell around q .
2 2
The location of the cell boundaries for q and q act as cell centers for q , whereas the locations
1 3 2
ofthecellcenters forq and q act as cell boundariesforq .
1 3 2
Using staggered grids improves the accuracy of the algorithm and it also solves the odd-
evendecouplingproblem. It isalsomorestablenumericallythancell-centered algoriths. Where
cell-centered algorithms sometimes crash when the algorithm is stretched too far, a staggered
gridalgorithmusuallysurvivesthoseconditions.
→ Exercise: Show,usingtheexampleabove,thatastaggeredgriddoesnothavetheodd-even
decouplingproblem.
Adrawbackofstaggeredgridsisthatitrequiresamuchmorecomplexbook-keepingofthe
cells and interfaces, especially when one goes to multiple dimensions. This also could make it
slightlymoredifficultto implementadaptivemesh refinement methodsand such.
A number of hydrodynamics codes use staggered grids. For instance, the famous ZEUS
code, often used in astrophysics, is based on staggered grids. But also many code are based on
cell-centered schemes. Bothapproaches havetheirspecial advantagesand disadvantages.
5.9 External gravity force
It possible,withoutmuch effort, to add an external force to the hydrodynamicsscheme wehave
produced so far. For instance, if we wish to model the flow of gas in a gravity field, we need to
solvethefollowingequations(1-D forsimplicity):
∂ ρ+∂ (ρu) = 0 (5.33)
t x
∂ (ρu)+∂ (ρu2 +P) = −ρ∂ Φ (5.34)
t x x
∂ (ρe )+∂ [(ρe +P)u] = −ρu∂ Φ (5.35)
t tot x tot x
whereΦ(x)isthegravitationalpotential. The−ρ∂ Φtermontherhsofthemomentumequation
x
is the force, whereas the −ρu∂ Φ term on the rhs of the energy equation is the work done by
x
the gravity on the total energy. The idea behind the latter term is that even though the gravity
force does not directly affect the thermal energy of the gas, it does affect the total energy of the
gas: thekineticenergy e = u2/2 changes dueto achangeinu. Thesourceterm intheenergy
kin
equationtakes careofthis.
Anexampleofanapplicationofthissetofequationsisthatofaperturbationonanotherwise
hydrostaticatmosphereonthesurfaceofaplanet(suchasEarth). Letusdefinextobetheheight
above the surface of the planet and the gravity potential Φ(x) = g x. A static solution must
be such that the ∂ terms of the above equations will be identically zero. Also we must have,
t
by definition, u = 0 everywhere. The continuity equation is then automatically solved. The
momentumequation,ontheotherhand,becomes:
∂P ∂Φ
= −ρ (5.36)
∂x ∂x
In discreteformthisbecomes:
P i+1 −P i−1 = −ρ Φ i+1 −Φ i−1 (5.37)
x i+1 −x i−1 i x i+1 −x i−1
So ifwecan constructastaticatmospherewhich obeysthisequation,then thenumerical hydro-
dynamics algorithm will produce perfectly zero time derivatives. In other words: it has ‘recog-
nized a static solution’. We can then add a small perturbation on this solution and see how it
moves.

## 페이지 19
91
5.10 Alternative methods for the energy equation
5.10.1 Including the gravitationalpotential into thetotal energy
If gravity forces are included, the global energy conservation is not guaranteed anymore. Some
codestherefore includethepotentialΦintothetotalenergy: e = e +u2/2+Φ. Inthat case
tot th
onecan derivethattheenergy equationbecomes
∂ [ρ(e +u2/2+Φ)]+∂ [ρ(e +u2/2+Φ+P/ρ)u] = ρ∂ Φ (5.38)
t th x th t
where the only remaining source term on the rhs is the time derivative of the potential. In a
static potential this would therefore be zero, and perfect conservation of total energy is again
guaranteed, eveninthepresenceofgravity.
5.10.2 Usingthe thermal energy orentropy as theadvected variable
A drawback of using the total energy ρe = ρ(e + u2/2) (or ρe = ρ(e + u2/2 + Φ) in
tot th tot th
case oftheinclusionofgravity)as theto-be-advected quantityisthat thiscould lead tonegative
pressuresinthesimulation,whichcouldcrashthesimulation. Tofindthepressureatanytimein
the algorithm we must first compute the u2/2 from the velocity, and then subtract this from the
totalenergy. In caseofgravity,oneshouldalsosubtractΦ. So wehave:
e = e −u2/2−Φ (5.39)
th tot
Now suppose we have a situation in which e ≪ u2/2 and/or e ≪ Φ, then the value of e is
th th th
the result of the difference between two large, and nearly equal numbers. Now, the momentum
equation(whichdeterminesu)andthetotalenergyequation(whichdeterminese )mayalways
tot
have some small numerical errors. So these errors could then easily lead to an unwanted flip of
signofe −u2/2−Φ,leadingtoanegativethermalenergy,andhenceanegativepressure. This
tot
wouldmeanthattheprogramwillhavetodoanemergencystop. Problemsofthiskindcanoccur
whentheflowisextremelysupersonic. Thetotalenergy isthennearlycompletelydominatedby
thekineticenergy. A tinyerrorineitheru ore couldthen lead tonegativeenergies.
tot
For this reason some codes prefer to let go of strict energy conservation and use another
form oftheenergy equation:
P
D e ≡ ∂ e +u∂ e = − ∂ u (5.40)
t th t th x th x
ρ
whichistheLagrangeformoftheenergyconservationequation(seeChapter1). TheZEUScode
usesthiskindofenergy equation. Thenumericalintegrationofthisequationthenproceeds with
the algorithms of Chapter 3, and the rhs of the equation is added in the usual way. This form of
the energy equation has the clear advantage that it is easier to control, and negativeenergies do
notoccur unlessthetimestep was taken too big. Thedrawback is, ofcourse, that energy is now
not anymore strictly conserved, and one must always check a-posteriori if the energy error has
notincreased to unacceptablelevels.
An alternative, but rather similar approach is to advect the entropy instead of the internal
energy:
TD s ≡ T(∂ s+u∂ s) = Q (5.41)
t t x
where Q is the entropy generation source term. The main advantage is that entropy generation
canbestrictlycontrolled. Thiscanbeofgreatadvantage,forinstanceinsimulatingatmospheres
where the entropy gradients decide about convective stability or instability of an atmosphere.

## 페이지 20
92
Thismethodofusingtheentropyequationisusedin,forinstance,thePENCILcode,whichisa
codeformodelingaccretion disksin astrophysics.
If the thermal energy equation or the entropy equation is used instead of the total energy,
then the importance of the use of the Von Neumann-Richtmyer artificial viscosity is amplified
enormously. This can be easily understood by looking at Eq. (5.41). Suppose we start with an
isentropicstateeverywhere,butwehaveconditionssuchthatashockwaveforms. Ashockwave
generates entropy. But if we have Q = 0, then the entropy equation will not generate entropy.
The solution of the state behind the shock will therefore clearly be wrong, and in practice it
will generate strong oscillations or other unwanted behavior. Now we must include an entropy-
generatingsourceterm inorderto producetherightamountofentropy.
5.11 2-D/3-D Hydrodynamics
So far we have focused primarily on 1-D hydrodynamics. In many cases our final interest lies
in multi-dimensional gas flow, as this is a more realistic and interesting projection of reality.
Fortunately the methods we have covered so far can be relatively easily used for 2-D and 3-D
gasflow. Thisisdonewiththemethodofoperatorsplitting,inwhichweapplyouralgorithmsof
hydrodynamicintegrationalternativelyinx,yandzdirection. Wehaveappliedoperatorsplitting
alreadybeforeinothercontexts. Hereweusethistechniquetosplitthe2-Dor3-Dprobleminto
itsseparatedirections(Strang, 1968,SIAM, J. Num. Anal,5, 506).
Thereare alsocomputercodes thatdo notusedirectionaloperatorsplitting. Theysolvethe
multi-dimensional problem in one go. One of the advantages of such non-splitting algorithms
is that they tend to be less prone to numerical artifacts. But the disadvantage of non-splitting
algorithms is that they have to be developed from scratch, i.e. they cannot build on algorithms
developedfor1-D.Theyarethereforeusuallyhardertodevelop. Inthislecturewewilltherefore
exclusivelyfocus ontheuseofStrang’sdirectionaloperatorsplitting.
Let uswritetheequationsofhydrodynamicsin2-D:
∂ ρ+∂ (ρu)+∂ (ρv) = 0 (5.42)
t x y
∂ (ρu)+∂ (ρu2 +P)+∂ (ρuv) = 0 (5.43)
t x y
∂ (ρv)+∂ (ρuv)+∂ (ρv2 +P) = 0 (5.44)
t x y
∂ (ρe )+∂ [(ρe +P)u]+∂ [(ρe +P)v] = 0 (5.45)
t tot x tot y tot
Thesplittingis nowthatwefirst solve
∂ ρ+∂ (ρu) = 0 (5.46)
t x
∂ (ρu)+∂ (ρu2 +P) = 0 (5.47)
t x
∂ (ρv)+∂ (ρuv) = 0 (5.48)
t x
∂ (ρe )+∂ [(ρe +P)u] = 0 (5.49)
t tot x tot
foronetimestep,and thensolve
∂ ρ+∂ (ρv) = 0 (5.50)
t y
∂ (ρu)+∂ (ρuv) = 0 (5.51)
t y
∂ (ρv)+∂ (ρv2 +P) = 0 (5.52)
t y
∂ (ρe )+∂ [(ρe +P)v] = 0 (5.53)
t tot y tot

## 페이지 21
93
for the same time step. Some codes do first 1/2 a time step in x-direction, then 1 time step in
y-directionand finallyanother1/2timestep inx-direction. Thishas aslightlyhigheraccuracy.
Ifallthequantitiesliveatthegridcellcenters(likethealgorithmsshowninthischapter,i.e.
not the staggered grid ones) then one can simplify the system even more, because then the full
2-DproblemofN ×N gridcellscanbesplitintoasetofN 1-Dproblemsinx-directionplusa
x y y
setofN 1-Dproblemsiny-direction. Wecanthensimplyusethe1-DhydrosolverN timesin
x x
x-direction and N times in y-direction, provided that we include the perpendicular momentum
x
components also into the equation. So for the N 1-D problems in x-direction we must include
y
ρv as another conserved quantity and likewise for the N 1-D problems in y-direction we must
x
include ρu as a conserved quantity. Since these perpendicular momentum components act as
passivetracers (i.e. have no influence on the flow pattern), the inclusion of these components is
nearlytrivial. Notethatthismethodofsplittingthe2-Dproblemintosetsof1-Dproblemsisonly
possible for non-staggered grids. The reason is that if, like the ZEUS code, one uses staggered
grids, then the x-momentum lives on (i + 1/2,j) interfaces while the y-momentum lives on
(i,j +1/2)interfaces. The two momentumcomponentstherefore do not liveon gridpointsthat
arelocatedonthesame1-Dline. Therefore,theschemesusedinZEUS,whiletheyuseoperator
splitting, they cannot go this extra step of reducing the problem to separate 1-D problems. For
codes where the momenta are at the cell centers this problem is not there and the reduction to
1-D problemsispossible.
With cell-centered algorithms the 2-D or 3-D problem is therefore only marginally more
complicated (technically) than the 1-D problem. All our effort in creating a 1-D hydro solver
therefore pays off: with only a little effort a fully functional multi-dimensionalprogram can be
created, withthe1-D hydrosubroutineat itsbasis.
5.12 Practical matters: input and output of data
Once we wish to do serious modeling we cannot afford ad-hoc management of time steps and
output of data anymore. We must think carefully about how to input and output our data, in
particular if we wish to write a work horse application in a fast programming language such as
Fortran (either F77, F90 or F95), or C/C++. There are a couple of thoughts which might be of
use,butsomethoughtsapplyonlytocodesthatgobeyondthesimpleIDLprogrammingdonein
thislecture:
1. In case of workhorse codes, it often is useful if the initial density, energy and velocity
distributionisread intothecodeinafile formatthatis similartotheoutputfileformat. In
this way an outputof the hydro code can later be used as the starting point of a continued
simulation.
2. In true applications one rarely wants to store the results of each time step. That is too
storage-intensive. One typically sets pre-defined model times at which the code should
outputa frame. The timestepping is then doneusing the usual CFL timestep limit, but if
thetimeisabouttojumpoveroneofthepre-definedsave-time,thenoneshortensthetime
step such that the precise save time is reached. Then a dump of the current state is made,
and thesimulationiscontinued.
3. Especially for 2-D and 3-D simulations a compact file format is useful. A simple and
reasonably compact way is to use fortran-style unformatted output. However, one should
keep in mind that on someplatforms the byte-orderis swapped. If a frame written on one

## 페이지 22
94
computerlooksunintelligibleonanothercomputer,thenonemaywanttolookinto“endian
swapping”. In IDL there is a keyword in the file management routines to automatically
swap endian. Another, quite popular method of storage is the HDF format. It is very
portableto otherplatformsand isparticularlysuitedforlarge datavolumes.
4. For safety, in particular for large multi-dimensional applications, one might want to set a
maximumnumberoftimesteps,so thatifasimulationgets stuck,itwon’t continueto eat
upallCPU time. Also,forsimilarsafetyconcernsonemightwishtosetamaximumnrof
stepsthecodecandowithoutwritingasafetydumpofitsvariables. Andfinally,itisuseful
to make the code dump the entire state as it was before the time step if an unrecoverable
erroroccurs.
