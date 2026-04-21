# Incremental Potential Contact

> 원본: `contact/Incremental Potential Contact.docx`

Incremental Potential Contact
The contact problem
x: nodal positions
M; finite element mass matrix
: hyper-elastic deformation energy
: external forces
: dissipative frictional forces
: contact energy
The IP for implicit Euler
h; the time step size
Minimization of the IP
: admissible set of trajectories
: the linear trajectory between  and
뉴턴 방법을 사용하면,
Barrier energy
Newton-type barrier solver
Each barrier Hessian has the form
IPC solution accuracy
: IP’s contact forces
: a time-stepping incremental potential
: the barrier potential
: the lagged dissipative potential for friction
최적화 이론 ; 뉴턴 방법
: the Hessian of E
Contact potential (point-triangle collision & edge-edge collision)
: point
: Triangle
: Edge
A smooth log Barrier function of unsigned distance
: barrier stiffness
The local friction
: contact point
: sliding basis
: normal contact force
: the frictional coefficient
: the relative tangential velocity
: a function smoothly increase from 0 to 1 in the region [0, ]
: controlling the region of static friction
Elasticity potential 에 대한 최적화를 어떻게 할까?
Neo-Hookean elasticity potential [단위 : J/m^3]
: relative volume change
: Polar decomposition, deformation gradient
: First right Cauchy-Green invariant
: Right Cauchy-Green tensor
: Young’s modulus
: Poisson’s ratio
