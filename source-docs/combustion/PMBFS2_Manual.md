# PMBFS2_Manual

> 원본: `combustion/PMBFS2_Manual.pdf` (3.2MB, 150 페이지 추출)

## 페이지 1
PMBFS-2 U M
SER’S ANUAL
Parallel Multi-Block Flow Solver
Version 2.0 for
Turbulent Reacting Two-Phase Flows
Dong-Jun Ma, Vigor Yang
Department of Mechanical Engineering
The Pennsylvania State University
University Park, PA 16802
February 28, 2009

## 페이지 2
Abstract
PMBFS2 (Parallel Multi-Block Flow Solver, Version 2) is the next generation high fidelity
CFD platform for multi-physics simulation of complex engineering turbulent reacting two-phase
flows. PMBFS2 is a general purpose, structured, multiblock, multi-dimensional flow solver for
thesolutionoftheEulerortheNavier-Stokesequations. Themaincharacteristicsofthesoftware
are:
• A new generation CFD platform for multi-physics simulation and analysis (Turbulence,
multi-phase, chemical reacting flows)
• A comprehensive unified approach for high fidelity multi-physics modeling of compressible
and incompressible all-speed flows
• State-of-the-art numerical discretization methods on high efficient and flexible structured
grid.
• An open framework for providing easy access for user defined modules
PMBFS2 offers three different classes of turbulence models: full LES (Large Eddy Simula-
tion), RANS (Reynolds Averaged Navier Stokes) and Hybrid model, i.e. LES with near wall
model. The RANS models included in PMBFS2 include algebraic models, k−(cid:178) eddy viscosity
models, the various k −ω eddy viscosity model. A wall function capability is included to in-
tegrate the high Reynolds number models on configurations with walls. The LES subgrid scale
Modelling contains basic Smagorinsky and dynamic SGS models. The near wall model can be
based on RANS or turbulent boundary layer profiles. For turbulent flows with thin wall shear
layer, one can use LES with wall model, or DES (Detached Eddy Simulation) where the inner
and outer layer is more tightly coupled.
PMBFS2 provides the multi-physics Eulerian-Lagrangian framework to simulate chemically
reacting two-phase flow. The code integrated a more robust liquid phase physical model into the
framework including liquid fuel evaporation with mass and heat transfer, and built a unified all-
speed numerical framework for compressible and incompressible flows. PMBFS2 implemented
the multi-physics Eulerian-Lagrangian two-way coupling in the code for the simulation of multi-
species two-phase flow.
PMBFS2 provides options to calculate either steady-state or time dependent flow. PMBFS2
is capable of calculating unsteady flows using either an explicit Runge-Kutta time integration
scheme or a second-order accurate iterative, implicit time integration scheme. The iterative,
implicit time integration allows for the calculation of unsteady flows using a time step which is
larger than the explicit scheme allows while retaining second-order temporal accuracy.
PMBFS2 uses a domain decomposition structure to accommodate complex physical configu-
rations. The use of a structured block approach allows the discretization of complex geometries.
This approach requires that grid distributions match on adjoining blocks. While this is not the
i

## 페이지 3
mostgeneralapproachforcomplexgeometries,itallowsforthediscretizationofmanygeometries.
Additionally, The framework provides for options to calculate either two-dimensional or axisym-
metric flows without the full computational time and storage overhead of a three-dimensional
calculation.
ii PMBFS2 User’s Manual

## 페이지 4
Contents
1 Introduction 1
1.1 Background of Complex Flow Simulation . . . . . . . . . . . . . . . . . . . . . . . 1
1.1.1 Multi-Physics Modeling . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.1.2 Software Development . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
1.2 Overview of PMBFS2 Features . . . . . . . . . . . . . . . . . . . . . . . . . . . . 3
1.2.1 Geometry Description . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 4
1.2.2 Flow Physics . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
1.2.3 Numerical Methods . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 5
1.2.4 Software Framework . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 6
2 Governing Equations 7
2.1 Governing Equations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 7
2.1.1 Governing Equations in Cartesian Coordinates . . . . . . . . . . . . . . . 9
2.1.2 Coordinate Transformation . . . . . . . . . . . . . . . . . . . . . . . . . . 11
2.1.3 Navier-Stokes Equations in Generalized Coordinates . . . . . . . . . . . . 12
3 Turbulence Modeling: Reynolds Averaged Navier-Stokes 15
3.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 15
3.2 Favre and Reynolds (Ensemble) Averaged Equations . . . . . . . . . . . . . . . . 15
3.3 Zero-equation Turbulence Closure Models . . . . . . . . . . . . . . . . . . . . . . 17
3.3.1 Baldwin-Lomax Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17
3.4 One- and Two-equation Turbulence Closure Models . . . . . . . . . . . . . . . . . 18
3.4.1 Spalart-Allmaras Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . 18
3.4.2 k−ε Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 19
3.4.3 Wilcox k−ω Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 19
3.4.4 Menter’s k−ω SST Model . . . . . . . . . . . . . . . . . . . . . . . . . . 20
4 Turbulence Modeling: Large-Eddy Simulation 23
4.1 Spatial Filtering . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 25
4.2 Filtered Governing Equations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 26
4.3 Subgrid-Scale Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 28
4.3.1 Algebraic Smagorinsky Type Model . . . . . . . . . . . . . . . . . . . . . 28
4.3.2 Dynamic Smagorinsky Model . . . . . . . . . . . . . . . . . . . . . . . . . 29
4.4 Hybrid RANS/LES . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 30
5 Chemical Equilibrium and Non-Equilibrium Modeling 33
5.1 Chemical Kinetics . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 33
5.2 Turbulent Combustion Models. . . . . . . . . . . . . . . . . . . . . . . . . . . . . 35
iii

## 페이지 5
Contents
6 Multi-Phase Modeling 37
6.1 Hierarchy of Multi-Phase Models . . . . . . . . . . . . . . . . . . . . . . . . . . . 37
6.2 Eulerian-Lagrangian Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 39
6.2.1 Model Assumptions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 39
6.2.2 Spray Dynamics . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 40
6.2.2.1 Equations of Motion for Droplet . . . . . . . . . . . . . . . . . . 40
6.2.2.2 Turbulent Dispersion of Droplet . . . . . . . . . . . . . . . . . . 41
6.2.3 Spray Mass and Heat Transfer . . . . . . . . . . . . . . . . . . . . . . . . 41
6.2.4 Spray Closure Models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 42
6.2.4.1 Primary Atomization Models . . . . . . . . . . . . . . . . . . . . 42
6.2.4.2 Secondary Atomization (Droplet Breakup) Models . . . . . . . . 43
6.2.4.3 Droplet Collision Models . . . . . . . . . . . . . . . . . . . . . . 43
6.2.4.4 Droplet/Wall Interaction . . . . . . . . . . . . . . . . . . . . . . 43
6.2.5 Coupling between Disperse and Carrier Phases . . . . . . . . . . . . . . . 43
7 Preconditioning Method 45
7.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 45
7.2 A Unified Preconditioning Scheme for General Fluid Mixtures . . . . . . . . . . . 46
7.2.1 Important Thermodynamic Relationships . . . . . . . . . . . . . . . . . . 47
7.2.2 Preconditioning Matrix . . . . . . . . . . . . . . . . . . . . . . . . . . . . 51
7.2.2.1 Transformation Matrix for General Equation of State . . . . . . 53
7.2.2.2 Transformation Matrix for Caloric and Thermally Perfect Gas . 56
7.2.3 Convergence Optimization . . . . . . . . . . . . . . . . . . . . . . . . . . . 57
7.2.3.1 Inviscid Preconditioning Factor . . . . . . . . . . . . . . . . . . . 58
7.2.3.2 Unsteady Preconditioning Factor . . . . . . . . . . . . . . . . . . 58
7.2.3.3 Viscous Preconditioning Factor . . . . . . . . . . . . . . . . . . . 59
8 Spatial Discretization 61
8.1 Finite Volume Approximations . . . . . . . . . . . . . . . . . . . . . . . . . . . . 61
8.2 Central Scheme . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 63
8.2.1 Artificial dissipation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 64
8.3 Upwind Scheme . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 67
8.3.1 Roe Scheme . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 67
8.3.2 High Order MUSCL Method . . . . . . . . . . . . . . . . . . . . . . . . . 68
8.3.2.1 Flux Limiter . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 69
9 Temporal Discretization 71
9.1 Explicit Time Integration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 71
9.1.1 Runge-Kutta Scheme . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 72
9.2 Implicit Time Integration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 73
9.2.1 Diagonalized ADI . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 74
9.2.2 LU-SSOR and LU-SGS . . . . . . . . . . . . . . . . . . . . . . . . . . . . 75
10 Parallel Computation 77
10.1 Parallel Architecture . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 77
10.2 Domain Decomposition . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78
10.3 Parallel Programming . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78
10.3.1 Message Passing . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 78
10.3.2 Hybrid MPI/OpenMP . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 79
iv PMBFS2 User’s Manual

## 페이지 6
Contents
10.3.3 Overlapping Communication and Computation . . . . . . . . . . . . . . . 79
10.3.4 Load balance . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 80
11 Software Framework: Design, Structure and Implementation 83
11.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 83
11.1.1 Designing a Modular Software Environment . . . . . . . . . . . . . . . . . 84
11.1.1.1 Design Objectives . . . . . . . . . . . . . . . . . . . . . . . . . . 84
11.1.1.2 Design Philosophy . . . . . . . . . . . . . . . . . . . . . . . . . . 85
11.1.1.3 Comprehensible and Extensible Structure . . . . . . . . . . . . . 85
11.1.1.4 Hierarchical Platform . . . . . . . . . . . . . . . . . . . . . . . . 86
11.1.2 PMBFS2 Framework . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 87
11.2 Data Structure . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 90
11.2.1 Data Modules and Global Variables . . . . . . . . . . . . . . . . . . . . . 90
11.2.1.1 Definition of parameter and class . . . . . . . . . . . . . . . . . . 90
11.2.1.2 Data module for MPI communication . . . . . . . . . . . . . . . 93
11.2.1.3 Data module for global variables . . . . . . . . . . . . . . . . . . 94
11.2.1.4 Data module for spray model . . . . . . . . . . . . . . . . . . . . 105
11.2.2 Description of Data Structure . . . . . . . . . . . . . . . . . . . . . . . . . 109
11.3 Program Structure . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
11.3.1 Flow Chart . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
11.3.1.1 Main Program . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
11.3.1.2 Main Solver . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
11.3.2 Subroutines . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
11.3.2.1 addvis_s . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
11.3.2.2 addvis_stvd . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
11.3.2.3 addvis_m . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 115
11.3.2.4 bc . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 116
11.3.2.5 bc_moc . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
11.3.2.6 bc_block . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
11.3.2.7 bc_parallel . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
11.3.2.8 cflux_central . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
11.3.2.9 cflux_upwind. . . . . . . . . . . . . . . . . . . . . . . . . . . . . 117
11.3.2.10chem_source . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
11.3.2.11chem_solve_implicit . . . . . . . . . . . . . . . . . . . . . . . . 119
11.3.2.12chem_ignite . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
11.3.2.13eos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
11.3.2.14init_flowfield . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 119
11.3.2.15init_solver . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
11.3.2.16lib . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
11.3.2.17main. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 120
11.3.2.18metric . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 121
11.3.2.19monitor . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.20pmbfs_data_mod . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.21pmbfs_io . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.22pmbfs_mod . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.23propin . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.24residual . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.25rhs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
PMBFS2 User’s Manual v

## 페이지 7
Contents
11.3.2.26smooth . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.27solve . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 122
11.3.2.28solve_rk . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 124
11.3.2.29solve_diagadi. . . . . . . . . . . . . . . . . . . . . . . . . . . . . 124
11.3.2.30solve_lussor . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 124
11.3.2.31spray_constant, spray_data_structure, spray_variables . . . . . 125
11.3.2.32spray_mod . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
11.3.2.33spray_physics . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
11.3.2.34spray_solve . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
11.3.2.35spray_mpi . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 125
11.3.2.36timestep. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.37timer_mod . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.38transp . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.39turb_models . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.40turb_bldlmx . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.41turb_spalart . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 126
11.3.2.42turb_kepsln . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.43turb_komega . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.44turb_sgs . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.45turb_wdist . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.46udf_init . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.47udf_monitor . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.48udf_postsolve . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.49update_consvars . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.3.2.50vflux. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 128
11.4 Code Implementation. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 129
11.4.1 Programming Rules . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 129
11.4.2 Programming Environment . . . . . . . . . . . . . . . . . . . . . . . . . . 129
11.4.2.1 Operating System . . . . . . . . . . . . . . . . . . . . . . . . . . 129
11.4.2.2 Compiler . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 129
11.4.3 Performance Analysis . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 131
11.4.3.1 Timing . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 131
11.4.3.2 Profiling . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 132
11.4.4 Version Release . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 133
vi PMBFS2 User’s Manual

## 페이지 8
Contents
12 Getting Started: Installation and Execution 135
12.1 Code Directory Structure . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 135
12.2 Compiling the Code . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 137
12.2.1 FORTRAN Pre-Processing . . . . . . . . . . . . . . . . . . . . . . . . . . 137
12.2.2 Definition of Parameters . . . . . . . . . . . . . . . . . . . . . . . . . . . . 139
12.2.3 Making an Executable . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 140
13 Tutorial: Running Cases 143
13.1 Gather simulation information . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144
13.1.1 Geometry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144
13.1.2 Flow Conditions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144
13.1.3 Boundary Conditions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 144
13.2 Create the computational grid . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.3 Define the input with IC/BC . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.3.1 Descriptive Header and Comments . . . . . . . . . . . . . . . . . . . . . . 145
13.3.2 Boundary Conditions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.3.3 Flow and Initial Conditions . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.3.4 Physical Model Controls . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.3.5 Numerical Model Controls . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.4 Run the code . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.5 Monitor convergence . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.6 Examine and analyze the results . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
13.7 Summary . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 145
14 Input and Output Files 147
14.1 Input Files . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 147
14.1.1 Configuration file (config.inp) . . . . . . . . . . . . . . . . . . . . . . . . 147
14.1.1.1 Grid mode . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 148
14.1.1.2 Flow-field mode . . . . . . . . . . . . . . . . . . . . . . . . . . . 148
14.1.1.3 Turbulence mode . . . . . . . . . . . . . . . . . . . . . . . . . . . 149
14.1.1.4 Reactions mode . . . . . . . . . . . . . . . . . . . . . . . . . . . 149
14.1.1.5 Two-phase mode . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
14.1.1.6 Initialize mode . . . . . . . . . . . . . . . . . . . . . . . . . . . . 150
14.1.1.7 Spatial-accuracy mode . . . . . . . . . . . . . . . . . . . . . . . . 151
14.1.1.8 Temporal-accuracy mode . . . . . . . . . . . . . . . . . . . . . . 151
14.1.1.9 Preconditioning mode . . . . . . . . . . . . . . . . . . . . . . . . 152
14.1.1.10Initialize mode . . . . . . . . . . . . . . . . . . . . . . . . . . . . 152
14.1.1.11Run mode . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 153
14.1.1.12Postprocessing mode . . . . . . . . . . . . . . . . . . . . . . . . . 153
14.1.2 Grid file (grid.001) . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 154
14.1.3 Boundary and connectivity file (conn.001). . . . . . . . . . . . . . . . . . 155
14.1.4 Chemistry file (chem.inp) . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
14.2 Output Files . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
14.2.1 Restart File (rerun.001) . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
14.2.2 Plotting files . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 156
PMBFS2 User’s Manual vii

## 페이지 9
Contents
15 Verifications and Validations 159
15.1 System Verifications . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 159
15.1.1 Euler 1D Sod and Lax’s Shock Wave Problems . . . . . . . . . . . . . . . 159
15.1.2 Euler 2D Prandtl-Meyer Expansion Wave . . . . . . . . . . . . . . . . . . 160
15.1.3 Euler 2D Oblique Shock on a Wedge . . . . . . . . . . . . . . . . . . . . . 162
15.1.4 NS 1D Viscous Stationary Shock Wave . . . . . . . . . . . . . . . . . . . . 162
15.1.5 NS 2D Blasius Incompressible Laminar Flat Plate . . . . . . . . . . . . . 166
15.1.6 Multi-Species 1D Normal Premixed Combustion Flame . . . . . . . . . . . 167
15.2 Validations: Basic 2D Cases . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 167
15.2.1 Laminar Flow in Lid Driven Cavity . . . . . . . . . . . . . . . . . . . . . . 167
15.2.2 Laminar Flow over a 2D Circular Cylinder . . . . . . . . . . . . . . . . . . 169
A Detailed Formulations 173
A.1 Properties of the Favre Average (Based on Reynolds Average) . . . . . . . . . . . 173
A.2 Preconditioning Matrix and its Inversion . . . . . . . . . . . . . . . . . . . . . . . 174
A.2.1 Transformation Matrix for Caloric and Thermally Perfect Gas . . . . . . . 174
A.2.2 Transformation Matrix for Cubic Equation of State (CEOS) . . . . . . . . 176
A.2.3 Transformation Matrix for General Equation of State (GEOS) . . . . . . . 179
A.3 Eigenvalues and Eigenvectors . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 181
A.3.1 Eigenvectors for Caloric and Thermally Perfect Gas . . . . . . . . . . . . 181
A.3.2 Eigenvectors for General Equation of State (GEOS) . . . . . . . . . . . . 183
References 187
viii PMBFS2 User’s Manual

## 페이지 10
Chapter 1
Introduction
This document describes the theoretical basis and usage reference of the suite, a set of next
generation analysis, design and optimization tools for the aerodynamics, aerothermodynamics
and combustion systems. It is designed not only for industrial applications, but also for scientific
researches. Some of the main features are listed in Table 1.1.
PMBFS2 studio makes a major Computational Fluid Dynamics (CFD) code development
effort focused on the analysis of reacting flows inside combustors of gas turbine engines or liquid
rocket engines.
1.1 Background of Complex Flow Simulation
1.1.1 Multi-Physics Modeling
PMBFS2 is capable of simulating a compressible fluid flow composed of an arbitrary number
of gaseous species, N , and an arbitrary number of liquid-phase species, N . The flow may be
s liq
twodimensionalorthree-dimensional,steadyorunsteady,Eulerorviscous,laminarorturbulent,
subsonic through supersonic, fixed species concentrations or mixing, and chemically reacting or
non-reacting.
The gas phase may be treated as an ideal gas mixture or as a non-ideal gas using the Peng-
Robinson equation of state. The gas-phase transport equations include the global and species
continuity equations, the conservation of momentum and energy equations, and the turbulence
modeling equations. Depending on user inputs defining the type of flow to be simulated, only a
subset of these equations may actually be solved. Gas-phase transport equations are Reynolds
averaged (in mass-weighted variables) for turbulent flows. Large eddy simulation can also be
activated.
The liquid-phase species enter the domain at a finite number of user-specified injection lo-
cations as a statistically-significant sample of individual, spherical droplets. The liquid at each
injectormustbeasinglespecies,buteachinjectormayhaveadifferentliquidspecies. Lagrangian
equations for position and velocity are solved for the life histories of these droplet groups. The
presentmodeldoesnotaccountforeffectsduetodropletbreakupandcoalescence, droplet/shock
interactions, or phenomena associated with dense sprays and super-critical conditions. Regres-
sion rate correlations and an energy equation based on the vortex model are used to model the
size distribution and internal temperature distribution of each droplet group, which models how
the liquid phase evaporates into the gas phase.
Boundaryconditionssupportedinclude: subsonicinlet/outlet, supersonicinlet/outlet, slipor
no-slip walls, viscous wall with wall function, adiabatic or temperature specified walls, periodic
1

## 페이지 11
1.1. Background of Complex Flow Simulation
Table 1.1: PMBFS2 Main Features
(cid:88) 3D/2D/axisymmetricmulti-blockstructuredgridtopologycapabilities
Basic (cid:88)(cid:70) Unifiedall-Mach-numberformulationwithpseudo-timepreconditioning
Features (cid:88)(cid:70) Generalized thermodynamic and transport properties database (including calorically and
thermally perfect gases, equilibrium gas with curve fits, real fluids with cubic equation of
stateorgeneralequationofstate)
(cid:88)(cid:70) Turbulence models including algebraic (Baldwin-Lomax algebraic model), one-equation
(Spalart-Allmarasmodel)andtwo-equationmodels(k-epsilonandk-omegamodels)
Turbulence (cid:88) LargeEddySimulation(LES):staticordynamicsub-gridmodels
♦(cid:70) Detached Eddy Simulation (DES, two-equation based model of Strelets) and hybrid
LES/RANSofBaurleandEdwards
Chemistryoptions
(cid:88) Simplifiedsingle/two-stepkineticsWestbrook/Dryer
(cid:88)(cid:70) Generalfinite-ratechemistry
♦(cid:70) Adaptivechemistry
♦ Intrinsicallylow-dimensionalmanifold(ILDM)option
Turbulence-chemistryclosureoptions
Combustion (cid:88) Single-stepeddydissipationmodel(EDM),Eddybreak-up(EBU)model
♦(cid:70) ProbabilityDensityFunction(PDF)transportmodels
•Anassumedclipped-GaussianPDForajointscalarMonteCarloPDF
•Temperaturefluctuations: averageturbulentreactionratecoefficient,a)Assumedgaussian
PDF,b)AssumedbetaPDF
•Speciesfluctuations: averagespeciesproductofconcentrationusingamulti-variateassumed
betaPDF
♦(cid:70) Flameletbasedmodels
•FlameletsbasedonG-equationforpremixedcombustion
•Flameletsbasedonmixturefractionfornon-premixedcombustion
Two (cid:88)(cid:70) Eulerian-Lagrangian: Multiple-zoneLagrangianspraymodel
•Two-waycoupling
Phase ♦(cid:70) Eulerian-Eulerian: Volume-Of-Fluid(VOF)interfacecapturing
(cid:88) Cell-centredfinite-volumemethod
(cid:88) Centralscheme(scalarormatrixartificialdissipation,2ndor4thorderaccuracy)
(cid:88)(cid:70) Upwindscheme(RoeandWeighted-ENOschemes,2nd,3rd,or5thorderaccuracy)
Numerical ♦(cid:70) Hybrid: weightedhighordercentral/upwindscheme
Methods (cid:88) Explicit3-stage/4-stageRunge-Kuttascheme
(cid:88)(cid:70) Dualtimesteppingwith2nd/3rd-orderbackwarddifferencinginphysicaltime
(cid:88)(cid:70) AlternatingDirectionImplicit(ADI)orLower-UpperSymmetricGauss-Seidel(LU-SGS)
(cid:88)(cid:70) Implicitresidualsmoothingtechnique
(cid:88) Variousphysicalboundaryconditions
Boundary (supersonic/subsonicinlets/outlets,walls,periodic,symmetry,centerlinesingularity)
Condition ♦(cid:70) Wallfunctionforturbulentboundarylayer
(cid:88)(cid:70) Characteristicboundaryconditions
Parallel (cid:88)(cid:70) SPMDimplementationusingMPI/OpenMP
Computing (cid:88)(cid:70) Serial and parallel execution supported on various platforms: Windows, Linux and other
UNIX
Software ♦ CGNSinput/outputinterfaceprovideslinkwithanyCAD,pre/post-processingsystem
Engineering
(cid:88)meansthefeaturehasbeenimplemented,♦meanstherequiredfeatureinthefuture,
(cid:70)meanstheneworenhancedfeatureofPMBFS2.
2 PMBFS2 User’s Manual

## 페이지 12
Chapter 1. Introduction
planes, centerline singularities.
1.1.2 Software Development
Extreme Programming (XP)
Growth in computational power naturally facilitates higher fidelity computational simulation
techniques. But as simulation codes grow more sophisticated, their number of building-block
components also increases. The increased complexity is forcing a change from the cottage in-
dustry of one person/one code to team software development. For the continued viability of our
computational community we need to be more than clever engineers and mathematicians, we
also need to be competent software developers.[38]
The prior development of computational fluid dynamic (CFD) codes generally has consisted
of one or two people working focused applications or algorithms. Even when more people con-
tributed to the development of a code, one person contributed the bulk of the code and served
as gatekeeper for any changes. There is overlap in the capabilities of these codes because their
development processes were all sufficiently rigid as to make it cheaper to develop an independent
code with new functionality rather than to extend an existing code. This paradigm has worked
relatively well and has produced software packages widely used by industry and academia. Un-
fortunately, such software development strategies often result in codes that are complex and
burdensome to maintain, and frequently subsequent working groups produce distinct versions of
the code that are often incompatible with each other and previously released versions. Moreover,
cohesiveness and portability are typically lost, as additional researchers contribute to the code,
using their own coding style and practices.
In contrast to this ad hoc approach to code development, The PMBFS2 aims to break this
cycle by developing an extensible product. The PMBFS2 sought to incorporate the software
industry’s best practices, not only because of the challenges of working as a cohesive team, but
also to find methods which would extend the life cycle of the new code.
Heavyweight software engineering processes, which accommodate teams of tens of hundreds
of programmers working with a relatively well-defined set of requirements, were initially consid-
ered but rejected as being too restrictive for a research team of about 10 people. However, the
emerging agile software development movement is perceived to be well suited to the uncertain
requirements and size of teams typically present in a research environment.[25] The agile move-
ment views software development as an empirical, rather than defined, process.[41, 5] The agile
software development methodologies was determined to have the best fit with the inconstant
nature of a scientific research environment.
The team software development for scientific software[60, 1] is used in the design and im-
plementation procedure of PMBFS2 . The detail description is reviewed in the appendix. The
agile team developing process does not only maintain a stable base for the esisting functionality,
but also enable the rapid development of previously unplanned-for functionality.
1.2 Overview of PMBFS2 Features
PMBFS2 is a software framework to simulate and analyze complex flows such as turbulent
reacting multi-phase flow. The framework consists of a structured flow solvers. The structured
flow solver is a density-based flow solver.
PMBFS2 User’s Manual 3

## 페이지 13
1.2. Overview of PMBFS2 Features
1.2.1 Geometry Description
The geometry describing the computational domain may be two-dimensional planar, two-
dimensional axisymmetric or three-dimensional. For two-dimensional axisymmetric geometries,
the user creates a two-dimensional grid (radial and axial dimensions); the solver code automati-
cally creates three-dimensional sector from the two-dimensional grid. The computational mesh
may be composed of quadrilateral elements for two-dimensional planar and two-dimensional
axisymmetric geometries; for three-dimensional geometries, only hexahedral cells is permitted.
The user must supply a formatted grid file, and additional connectivity file which contain the
information on vertex locations and connectivity, as well as boundary condition flags for block
faces coinciding with the boundary of the computational domain. The terms ‘element’ and
‘cell’ are used interchangeably in this document.
The solver code in PMBFS2 is designed for massively parallel computations. The compu-
tational domain is automatically divided into spatial zones according to the grid files, with the
number of grid files equal to the number of processors used.
One-to-One Multiblock Grids
Before you start using the PMBFS2 code, you need to understand one or two things about
multi-block grids and solutions. Geometries are typically defined by surfaces, which indicate the
boundary between the computed region and the non-computed region. Physically, these surfaces
represent, for instance, the surface of an airfoil, the walls of a combustion chamber, the inlet or
exit plane in duct flow, etc. For example, imagine a cylinder in a duct, as represented in Fig. 1.1.
This geometry can be described by five surfaces. The first surface is the inlet plane upstream of
the cylinder. The second surface is the exit plane far downstream of the cylinder. The two walls
on either side of the cylinder represent two more surfaces, and the cylinder itself represents a
fifth surface.
X
Y
0.1
0.05
0
-0.05
-0.05 0 0.05 0.1 0.15
Figure 1.1: Example of a multi-block grid for a cylinder within a duct.
Multi-block grids in terms of the PMBFS2 code have fairly specific meaning. A multi-block
grid takes a given domain and breaks it up into N number of structured blocks. Each block
4 PMBFS2 User’s Manual

## 페이지 14
Chapter 1. Introduction
is surrounded by from zero to four other blocks (again, please refer to the figure.) For two-
dimensional grids, each point within a block is identified by an (i,j) pair, (similar to an (x,y)
pair on a cartesian coordinate system). The i = 1 plane is identified as the west boundary of
the block, the i = imax plane is identified as the east boundary, and so on. For the example in
Fig. 1.1, the domain is divided into 18 separate blocks.
For true multi-block grids, blocks that border each other have a one-to-one correspondence
for points on that border. That is, the location of any point on the boundary surface for the
one block corresponds exactly to a point on the surface of the other block. Describing how the
blocks match up is called the connectivity of the grid. For the PMBFS2 code, the grid data is
stored in plot3d format in grid.01, grid.02, ..., and the connectivity information is stored
in an ASCII format in conn.01, conn.02, ..., as is described below. The specific formats for
these files are described in detail under input files, and often represent the most complex part
about setting a CFD problem (depending, of course, on the complexity of the geometry).
1.2.2 Flow Physics
1.2.3 Numerical Methods
PMBFS2 offers three different classes of turbulence models: full LES (Large Eddy Simula-
tion), RANS (Reynolds Averaged Navier Stokes) and Hybrid model, i.e. LES with near wall
model. The near wall model can be based on RANS or turbulent boundary layer profiles. For
turbulent flows with thin wall shear layer, one can use LES with wall model, or DES (Detached
Eddy Simulation) where the inner and outer layer is more tightly coupled. For a highly unsteady
large structure motions away from the wall, such as in wall injection flows, it is recommended
to use full LES as the wall requirement is less stringent, while for high Reynolds number flows
with weak unsteadiness in the mean and if the interest is mainly on the mean ow, RANS is
more suitable due to the less demanding grid requirement. If desired, DES can be used for high
Reynolds number ow as well. DES is especially suitable for flows involving massive separation.
Thegas-phasetransportequationsaremodifiedbyaddingpseudo-timepreconditioningterms
which are driven to zero as the solver marches in pseudo-time. The user specifies the type of
preconditioning(loworhighMachnumber)inthesolverinputfileconfig.inp. Fortime-accurate
simulations,adualtime-steppingprocedureisusedwhichmarchesimplicitlyinphysicaltimeand
employsanexplicitfour-stageRunge-Kuttaschemeformarchinginpseudo-time(ateachphysical
time step). For steady-state simulations, the gas-phase equations are marched in pseudo-time by
an explicit four-stage Runge-Kutta scheme. Local pseudo-time stepping and residual smoothing
areusedateachRunge-Kuttastagetoaccelerateconvergence. Thegas-phasetransportequations
arespatiallydiscretizedusingacell-centeredfinite-volumemethodaugmentedwithablended4th
and 2nd order Jameson dissipation operator to avoid odd-even decoupling, provide stability and
smooth oscillations near shocks. In order to improve the resolution for shock wave, the upwind
MUSCL scheme with Roe approximate Riemann solver is utilized to discretize the convective
terms in the governing equations. The implicit temporal discretizations are also integrated into
the main framework. The diagonalized Alternative Direction Implicit (ADI) and the Lower-
Upper Symmetric Successive Over Relaxation (LU-SSOR) methods are the options which the
codeusercanselectedinthesolverinputfile. Thesourceterminthespeciescontinuityequations
due to chemical reactions is evaluated by a point implicit procedure at each Runge-Kutta stage.
Theliquid-phaseandradiativetransportequationsare‘loosely’ coupledtotheflowequations;
that is, liquid-phase and radiation source terms in the gas-phase equations are evaluated based
on flow variables from the previous pseudo-time step, rather than a simultaneous solution of the
gas-phase, liquid-phase and radiative transport equations.
PMBFS2 User’s Manual 5

## 페이지 15
1.2. Overview of PMBFS2 Features
The liquid-phase ordinary differential equations for droplet position, size and velocity are
solvedbyasecondorderRunge-Kuttamethod, whilethepartialdifferentialequationforinternal
droplet temperature are integrated by an Euler method. In order to evaluate initial conditions
for the liquid-phase equations, the gas-phase properties at each droplet location must be known,
which requires the determining which gas-phase computational cell contains the droplet. The
searchisinitiatedintheformofa localsearchfromthecomputationalcellofthepreviousliquid-
phase time step as the starting point. A gas-phase cell is determined to contain the droplet when
the dot product of all cell face outward normals with the vector formed by the droplet location
to the cell face center yield positive values. All possible interior cells are checked first before
checking any cells with boundary faces. After the liquid equations are solved, liquid source
terms are passed to the gas-phase equations.
1.2.4 Software Framework
PMBFS2 is mainly coded in the FORTRAN-90 and C/C++ programming languages. The
solver code is designed for massively parallel computations with message passing library MPI,
as well as it may be compiled and run using a single processor. PMBFS2 is supported on
WINDOWS, LINUX and a variety of UNIX platforms.
6 PMBFS2 User’s Manual

## 페이지 16
Chapter 2
Governing Equations
2.1 Governing Equations
The theoretical formulation is based on the full conservation equations of mass, momentum,
energy, and species concentration in Cartesian coordinates
∂ρ ∂ρu
j
+ = 0 (2.1)
∂t ∂x
j
∂ρu ∂(ρu u ) ∂p ∂τ
i i j ij
+ = − + (2.2)
∂t ∂x ∂x ∂x
j i j
∂ρE ∂[(ρE +p)u ] ∂q ∂(u τ )
j j i ij
+ = − + (2.3)
∂t ∂x ∂x ∂x
j j j
∂ρY ∂ρY u ∂ρY V
k k j k k,j
+ = − +ω˙ , k = 1,...,N (2.4)
k
∂t ∂x ∂x
j j
or in a compact form
∂ ∂
(ρ)+ (ρu ) = 0 (2.5)
j
∂t ∂x
j
∂ ∂
(ρu )+ (ρu +pδ −τ ) = 0 (2.6)
i i ij ij
∂t ∂x
j
∂ ∂
(ρE)+ (ρHu +q −u τ ) = 0 (2.7)
i j i ij
∂t ∂x
j
∂ ∂
(ρY )+ (ρY u +ρY V ) = ω˙ , k = 1,...,N (2.8)
k k i k k,j k
∂t ∂x
j
where i,j, and k are the spatial coordinate index, the dummy index to spatial coordinate, and
the species index, respectively. The variables ρ,u ,p,E,H,τ , and q , represent the density,
i ij i
velocity components, pressure, specific total energy, total enthalpy, viscous stress tensor, and
heat flux, respectively. N is the total number of species. Y and V are mass fraction and
k k,j
diffusion velocities of species k, respectively. The viscous stress tensor for a Newtonian fluid
(with Stokes assumption) and the heat flux vector are defined as
∂u ∂u 2 ∂u
i j l
τ = µ( + − δ ) (2.9)
i,j ij
∂x ∂x 3 ∂x
j i l
∂T
(cid:88)N
q = −λ +ρ h Y V (2.10)
j k k k,j
∂x
j
k=1
7

## 페이지 17
2.1. Governing Equations
where µ and λ are the coefficients of viscosity and thermal conductivity, respectively. T is
temperature. In the present work, viscosity and thermal conductivity can be represented by
polynomial functions of temperature for real fluid; or be estimated for more general case with an
extended-corresponding-state-principle with a 32-term Benedict-Webb-Rubin(BWR) equation
of state Jacobsen and Stewart(1973). The specific total energy E is given by
u u
j j
E = e+ (2.11)
2
The specific internal energy, e, is obtained as
p
e = h− (2.12)
ρ
Perfect gas case:
Thespecificenthalpyofmixture, h, containingcontributionsfromitsconstituentspecies, can
be written as (cid:195) (cid:33)
(cid:90)
(cid:88)N (cid:88)N T
h = Y h = Y ∆h◦ + C (T(cid:48))dT(cid:48) (2.13)
k k k f,k p,k
k=1 k=1
Tref
The species specific heat at constant pressure, C , can be approximated by a polynomial func-
p,k
tion of temperature
(cid:88)M
C = a Tl−1 (2.14)
p,k k,l
l=1
The formulation is closed by an equation of state for a perfect mixture
(cid:88)N
Y
k
p = ρR T h = ρRT (2.15)
u
W
k
k=1
where R is the universal gas constant and W is the molecular weight of species k.
u k
Real fluid case:
Thespecificenthalpyofmixture, h, containingcontributionsfromitsconstituentspecies, can
be written as
(cid:88)N
h = Y (cid:98)h (2.16)
k k
k=1
where (cid:98)h is partial mass enthalpy of species k, which will be defined in the following sections.
k
The formulation is closed by a modified Soave-Redlich-Kwong(SRK) equation of state for real
fluid mixture(Soave, 1972; Graboski and Daubert, 1978a, 1978b).
To obtain the expression for the chemical reaction source term, consider an L-step reaction
mechanism with N species, which can be written as (Kuo, 1986)
(cid:88)N (cid:88)N
ν(cid:48) χ ⇐
kf⇒i
ν(cid:48)(cid:48)χ , i = 1,2,...,L (2.17)
ki k ki k
kbi
k=1 k=1
whereν(cid:48) andν(cid:48)(cid:48) arethestoichiometriccoefficientsonthereactantsandproductssideforspecies
ki ki
k inthei-threaction. χ representsthechemicalformulaofspeciesk. k andk arethereaction
k fi bi
8 PMBFS2 User’s Manual

## 페이지 18
Chapter 2. Governing Equations
rate constants of the forward and backward reactions, respectively. They may take the following
form
k (T) = A Tbexp(−E /R T) (2.18)
i i i u
where A,b, and E are empirical parameters and E represents the activation energy of reaction
i i
i. The following relationship expresses the net production rate ω˙ of each species in a multi-step
k
mechanism
(cid:34) (cid:35)
(cid:88)L (cid:89)N (cid:89)N
ω˙ k = W k (ν k (cid:48)(cid:48) i −ν k (cid:48) i ) k fi [χ k ]ν k (cid:48) i −k bi [χ k ]ν k (cid:48)(cid:48) i , k = 1,2,...,N (2.19)
i=1 k=1 k=1
whereW and[χ ]representthemolecularweightandmolarconcentrationofspeciesk. Notethat
k k
the expression for the net production rate, Eq. 2.19, is valid only for elementary reactions. Since
some researchers may use a global kinetic mechanism, the exponents for molar concentrations
may differ from their stoichiometric coefficients.
2.1.1 Governing Equations in Cartesian Coordinates
The compressible three-dimensional Navier-Stokes equations (NSE), including body forces
and external heat sources, in Cartesian coordinates are
∂q ∂f ∂g ∂h ∂f ∂g ∂h
ν ν ν
+ + + = + + +S (2.20)
f
∂t ∂x ∂y ∂z ∂x ∂y ∂z
where the flow variables (ρ,u,v,w,p) are the function of (x,y,z,t) and
       
ρ ρu ρv ρw
 ρu   ρu2+p   ρuv   ρuw 
       
q =  ρv , f =  ρuv , g =  ρv2+p , h =  ρvw 
       
 ρw   ρuw   ρvw   ρw2+p 
ρE (ρE +p)u (ρE +p)v (ρE +p)w
   
0 0
 τ   τ 
 xx   yx 
f =  τ , g =  τ ,
ν  xy  ν  yy 
 τ   τ 
xz yz
uτ +vτ +wτ +k∂T uτ +vτ +wτ +k∂T
xx xy xz ∂x yx yy yz ∂y
   
0 0
 τ   ρS 
 zx   fx 
h =  τ , S =  ρS 
ν  zy  f  fy 
 τ   ρS 
zz fz
uτ +vτ +wτ +k∂T ρ(S +uS +vS +wS )
zx zy zz ∂z h fx fy fz
Here S ,S ,S are the body forces and S is the external heat source.
fx fy fz h
If the external forces are not included, the right hand side term S = 0.
f
If the flow is inviscid, the governing equations are Euler equations, f = g = h = 0.
v v v
The τ are the shear stress terms, and defined in tensor notations as
∂u ∂u ∂u
i j k
τ = µ( + )+λ δ
xixj
∂x ∂x ∂x
ij
j i k
PMBFS2 User’s Manual 9

## 페이지 19
2.1. Governing Equations
τ = 2µu +λ(u +v +w ), τ = 2µv +λ(u +v +w ), τ = 2µw +λ(u +v +w )
xx x x y z yy y x y z zz z x y z
τ = τ = µ(u +v ), τ = τ = µ(v +w ), τ = τ = µ(u +w )
xy yx y x yz zy z y zx xz z x
If the Stokes hypothesis for bulk viscosity λ+2µ/3 = 0 is utilized, then
   
τ τ τ 4u − 2(v +w ) u +v u +w
xx xy xz 3 x 3 y z y x z x
τ =  τ τ τ  = µ u +v 4v − 2(w +u ) v +w 
xy yy yz y x 3 y 3 z x z y
τ τ τ u +w v +w 4w − 2(u +v )
xz yz zz z x z y 3 z 3 x y
For ideal gas, the constitutive relationship is
p 1
ρE = + ρ(u2+v2+w2), γ = 1.4
γ −1 2
x y z u v w t ρ p
x = , y = , z = , u = , v = , w = , t = , ρ = , p =
L L L V V V L/V ρ ρ V2
∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞
µ ρ U L k µ Cp
∞ ∞ ∞ ∞
µ = , Re = , k = , Pr =
µ µ k k
∞ ∞ ∞ ∞
The above equations can be nondimensionalized in terms of the free-stream density, ρ , the
∞
free-stream speed of sound, a , and the free-stream molecular viscosity, µ .
∞ ∞
The non-dimensional Navier-Stokes equation can be written as
(cid:181) (cid:182)
∂q ∂f ∂g ∂h 1 ∂f ∂g ∂h
ν ν ν
+ + + = + + (2.21)
∂t ∂x ∂y ∂z Re ∂x ∂y ∂z
       
ρ ρu ρv ρw
 ρu   ρu2+p   ρuv   ρuw 
       
q =  ρv , f =  ρuv , g =  ρv2+p , h =  ρvw 
       
 ρw   ρuw   ρvw   ρw2+p 
ρE (ρE +p)u (ρE +p)v (ρE +p)w
     
0 0 0
 τ   τ   τ 
 xx   yx   zx 
f =  τ , g =  τ , h =  τ 
ν  xy  ν  yy  ν  zy 
 τ   τ   τ 
xz yz zz
φ φ φ
x y z
(cid:181) (cid:182)
k ∂ γp
φ = uτ +vτ +wτ +
x xx xy xz
Pr∂x (γ −1)ρ
(cid:181) (cid:182)
k ∂ γp
φ = uτ +vτ +wτ +
y yx yy yz
Pr∂y (γ −1)ρ
(cid:181) (cid:182)
k ∂ γp
φ = uτ +vτ +wτ +
z zx zy zz
Pr∂z (γ −1)ρ
10 PMBFS2 User’s Manual

## 페이지 20
Chapter 2. Governing Equations
2.1.2 Coordinate Transformation
Now apply the generalized coordinate transformation with body-fitted coordinates (ξ,η,ζ),

 ξ = ξ(x,y,z,t)


η = η(x,y,z,t)
(2.22)
 ζ = ζ(x,y,z,t)


τ = t
From the chain-rule for a function of multiple variables, the derivatives of the generalized
coordinates can be written
     
dx x x x x dξ
ξ η ζ τ
dy y y y y  dη
  =  ξ η ζ τ  
dz z z z z  dζ
ξ η ζ τ
dt 0 0 0 1 dτ
Similarly, the derivatives of the Cartesian coordinates can be written
     
dξ ξ ξ ξ ξ dx
x y z t
dη η η η η  dy
  =  x y z t  
dζ ζ ζ ζ ζ  dz
x y z t
dτ 0 0 0 1 dt
Therefore, it is evident that the transformation relationship is
   
x x x x ξ ξ ξ ξ
ξ η ζ τ x y z t
∂(x,y,x,t) ∂(ξ,η,ζ,τ) y y y y  η η η η 
· =  ξ η ζ τ  x y z t = I (2.23)
∂(ξ,η,ζ,τ) ∂(x,y,x,t) z z z z  ζ ζ ζ ζ 
ξ η ζ τ x y z t
0 0 0 1 0 0 0 1
If the physical grid and computational grid are fixed, the reduced relationship can be written as
   
x x x ξ ξ ξ
∂(x,y,z) ∂(ξ,η,ζ) ξ η ζ x y z
· = y y y  η η η  = I (2.24)
ξ η ζ x y z
∂(ξ,η,ζ) ∂(x,y,z)
z z z ζ ζ ζ
ξ η ζ x y z
The jacobian of the transformation is defined to be the determinant of the matrix:
(cid:175) (cid:175) (cid:175) (cid:175)
1 (cid:175)∂(x,y,x,t)(cid:175) (cid:175)∂(ξ,η,ζ,τ)(cid:175)−1
= (cid:175) (cid:175) = (cid:175) (cid:175)
(cid:175) (cid:175) (cid:175) (cid:175)
J ∂(ξ,η,ζ,τ) ∂(x,y,x,t)
(cid:175) (cid:175)
(cid:175)x x x x (cid:175)
(cid:175) ξ η ζ τ(cid:175)
(cid:175)y y y y (cid:175)
= (cid:175) ξ η ζ τ(cid:175) = x (y z −y z )−x (y z −y z )+x (y z −y z ) (2.25)
(cid:175)z z z z (cid:175) ξ η ζ ζ η η ξ ζ ζ ξ ζ ξ η η ξ
(cid:175) ξ η ζ τ(cid:175)
(cid:175) (cid:175)
0 0 0 1
and the metrics of the jacobian are
ξ = J(y z −y z ), η = J(y z −y z ), ζ = J(y z −y z )
x η ζ ζ η x ζ ξ ξ ζ x ξ η η ξ
ξ = J(z x −z x ), η = J(z x −z x ), ζ = J(z x −z x )
y η ζ ζ η y ζ ξ ξ ζ y ξ η η ξ
ξ = J(x y −x y ), η = J(x y −x y ), ζ = J(x y −x y )
z η ζ ζ η z ζ ξ ξ ζ z ξ η η ξ
ξ = −x ξ −y ξ −z ξ
t τ x τ y τ z
η = −x η −y η −z η
t τ x τ y τ z
ζ = −x ζ −y ζ −z ζ
t τ x τ y τ z
τ = τ = τ = 0
x y z
PMBFS2 User’s Manual 11

## 페이지 21
2.1. Governing Equations
2.1.3 Navier-Stokes Equations in Generalized Coordinates
Thethree-dimensionaltime-dependentcompressibleNavier-Stokesequationcanbewrit-
ten in terms of generalized coordinates as the following where the derivatives with respect to
(x,y,z,t) are evaluated in terms of (ξ,η,ζ,τ).
(cid:183) (cid:184)
(cid:179) (cid:180)
∂ q ∂ 1(cid:161) (cid:162)
+ qξ +fξ +gξ +hξ
t x y z
∂t J ∂ξ J
(cid:183) (cid:184)
∂ 1(cid:161) (cid:162)
+ qη +fη +gη +hη
t x y z
∂η J
(cid:183) (cid:184)
∂ 1(cid:161) (cid:162)
+ qζ +fζ +gζ +hζ
t x y z
∂ζ J
(cid:183) (cid:184)
1 ∂ 1(cid:161) (cid:162)
= f ξ +g ξ +h ξ
v x v y v z
Re∂ξ J
(cid:183) (cid:184)
1 ∂ 1(cid:161) (cid:162)
+ f η +g η +h η
v x v y v z
Re∂η J
(cid:183) (cid:184)
1 ∂ 1(cid:161) (cid:162)
+ f ζ +g ζ +h ζ
v x v y v z
Re∂ζ J
The equivalent summed form can be read
(cid:181) (cid:182)
∂Q ∂F ∂G ∂H 1 ∂F ∂G ∂H
ν ν ν
+ + + = + + (2.26)
∂t ∂ξ ∂η ∂ζ Re ∂ξ ∂η ∂ζ
where Q is the vector of conserved variables
 
ρ
 ρu 
q 1  
Q = =  ρv 
 
J J
 ρw 
ρE
The inviscid flux terms are
 
ρU
 ρuU +ξ p 
1(cid:161) (cid:162) 1  x 
F = qξ +fξ +gξ +hξ =  ρvU +ξ p 
t x y z  y 
J J
 ρwU +ξ p 
z
(ρE +p)U −ξ p
t
 
ρV
 ρuV +η p 
1(cid:161) (cid:162) 1  x 
G = qη +fη +gη +hη =  ρvV +η p 
t x y z  y 
J J
 ρwV +η p 
z
(ρE +p)V −η p
t
 
ρW
 ρuW +ζ p 
1(cid:161) (cid:162) 1  x 
H = qζ +fζ +gζ +hζ =  ρvW +ζ p 
t x y z  y 
J J
 ρwW +ζ p 
z
(ρE +p)W −ζ p
t
12 PMBFS2 User’s Manual

## 페이지 22
Chapter 2. Governing Equations
The contravariant velocities are given by
U = ξ +ξ u+ξ v+ξ w = ξ (u−x )+ξ (v−y )+ξ (w−z )
t x y z x τ y τ z τ
V = η +η u+η v+η w = η (u−x )+η (v−y )+η (w−z )
t x y z x τ y τ z τ
W = ζ +ζ u+ζ v+ζ w = ζ (u−x )+ζ (v−y )+ζ (w−z )
t x y z x τ y τ z τ
The viscous flux terms are
 
0
 ξ τ +ξ τ +ξ τ 
1(cid:161) (cid:162) 1  x xx y xy z xz 
F = f ξ +g ξ +h ξ =  ξ τ +ξ τ +ξ τ 
v v x v y v z  x xy y yy z yz 
J J
 ξ τ +ξ τ +ξ τ 
x xz y yz z zz
ξ b +ξ b +ξ b
x x y y z z
 
0
 η τ +η τ +η τ 
1(cid:161) (cid:162) 1  x xx y xy z xz 
G = f η +g η +h η =  η τ +η τ +η τ 
v v x v y v z  x xy y yy z yz 
J J
 η τ +η τ +η τ 
x xz y yz z zz
η b +η b +η b
x x y y z z
 
0
 ζ τ +ζ τ +ζ τ 
1(cid:161) (cid:162) 1  x xx y xy z xz 
H = f ζ +g ζ +h ζ =  ζ τ +ζ τ +ζ τ 
v v x v y v z  x xy y yy z yz 
J J
 ζ τ +ζ τ +ζ τ 
x xz y yz z zz
ζ b +ζ b +ζ b
x x y y z z
The shear stress and heat flux terms are defined in tensor notations (summation convection
implied) as
(cid:181) (cid:182)
∂u ∂u 2 ∂u
i j k
τ = µ + − µ δ
xixj
∂x ∂x 3 ∂x
ij
j x k
b = u τ −q˙
xi j xixj xi
µ ∂a2
q˙ = −
xi
Pr(γ −1)∂x
i
 
k k k k 0
t x y z
 dpk −u(cid:98)u k +u(cid:98)−(γ −2)uk uk −(γ −1)vk uk −(γ −1)wk (γ −1)k 
 dρ x t x y x z x x 
   d d ρ pk y −u(cid:98)v vk x −(γ −1)uk y k t +u(cid:98)−(γ −2)vk y vk z −(γ −1)wk y (γ −1)k y   
 dpk −u(cid:98)w wk −(γ −1)uk wk −(γ −1)vk k +u(cid:98)−(γ −2)wk (γ −1)k 
dρ z x z y z t z z
(dp −H)u(cid:98) Hk −(γ −1)u(cid:98)u Hk −(γ −1)u(cid:98)v Hk −(γ −1)u(cid:98)w k +γu(cid:98)
dρ x y z t
(2.27)
(cid:113)
λ = k +u(cid:98)−c k2 +k2+k2
1 t x y z
λ = λ = λ = k +u(cid:98)
2 3 4 t
(cid:113)
λ = k +u(cid:98)+c k2 +k2+k2
5 t x y z
For Jacobian matrix A,B,C：
A = T Λ T−1, B = T Λ T−1, C = T Λ T−1 (2.28)
ξ ξ ξ η η η ζ ζ ζ
PMBFS2 User’s Manual 13

## 페이지 23
2.1. Governing Equations
 
1 k k k 1
x y z
  u−k(cid:102) x c k(cid:102) x u k(cid:101) y u−k(cid:101) z ρ k(cid:101) z u+k(cid:101) y ρ u+k(cid:102) x c  
 
T k =   v−k(cid:101) y c k(cid:102) x v+k(cid:101) z ρ k(cid:101) y v k(cid:101) z v−k(cid:102) x ρ v+k(cid:101) y c  
 w−k(cid:101)c k(cid:102)w−k(cid:101)ρ k(cid:101)w+k(cid:102)ρ k(cid:101)w w+k(cid:101)c 
 z x y y x z z 
H −u(cid:101)c kf x dp +ρ(k(cid:101)v−k(cid:101)w) kf y dp +ρ(k(cid:102)w−k(cid:101)u) kf z dp +ρ(k(cid:101)u−k(cid:102)v) H +u(cid:101)c
γ−1dρ z y γ−1dρ x z γ−1dρ y x
(2.29)
 
b2 + ue −ub1 − kf x −vb1 − kf y −wb1 − kf z b1
 2 2c 2 2c 2 2c 2 2c 2 
 k(cid:102)(1−b )−ρ−1(k(cid:101)v−k(cid:101)w) k(cid:102)ub k(cid:101)ρ−1+k(cid:102)vb −k(cid:101)ρ−1+k(cid:102)wb −k(cid:102)b 
 x 2 z y x 1 z x 1 y x 1 x 1 
T−1 =  k(cid:101)(1−b )−ρ−1(k(cid:102)w−k(cid:101)u) −k(cid:101)ρ−1+k(cid:101)ub k(cid:101)vb k(cid:102)ρ−1+k(cid:101)wb −k(cid:101)b 
k  y 2 x z z y 1 y 1 x y 1 y 1 
  k(cid:101) z (1−b 2 )−ρ−1(k(cid:101) y u−k(cid:102) x v) k(cid:101) y ρ−1+k(cid:101) z ub 1 −k(cid:102) x ρ−1+k(cid:101) z vb 1 k(cid:101) z wb 1 −k(cid:101) z b 1  
b2 − ue −ub1 + kf x −vb1 + kf y −wb1 + kf z b1
2 2c 2 2c 2 2c 2 2c 2
(2.30)
(cid:113)
其中b = (γ−1)/c2，b2 = (u2+v2+w2)b /2，u(cid:101)= k(cid:102)u+k(cid:101)v+k(cid:101)w，k(cid:102) = k / k2 +k2+k2。
1 1 x y z x x x y z
14 PMBFS2 User’s Manual

## 페이지 24
Chapter 3
Turbulence Modeling: Reynolds
Averaged Navier-Stokes
Turbulentflowsarecharacterizedbyfluctuatingvelocityfields. Thesefluctuationsmixtrans-
ported quantities such as momentum, energy, and species concentration, and cause the trans-
ported quantities to fluctuate as well. Since these fluctuations can be of small scale and high
frequency, they are too computationally expensive to simulate directly in practical engineer-
ing calculations. Instead, the instantaneous (exact) governing equations can be time-averaged,
ensemble-averaged, or otherwise manipulated to remove the small scales, resulting in a modi-
fied set of equations that are computationally less expensive to solve. However, the modified
equations contain additional unknown variables, and turbulence models are needed to determine
these variables in terms of known quantities.
Turbulence modeling is the area of physical modeling where a simpler mathematical model
thanthefulltimedependentNavier-StokesEquationsisusedtopredicttheeffectsofturbulence.
There are various mathematical models used in flow modelling to understand turbulence.
3.1 Introduction
3.2 Favre and Reynolds (Ensemble) Averaged Equations
Following Wilcox[58], Favre[18] averaging can be used with the Navier-Stokes equations to
account for turbulent fluctuations. The resulting equations of motion can be written using the
summation convention as follows. The full Navier-Stokes equations are shown as:
∂ρ ∂ρu
j
+ = 0 (3.1)
∂t ∂x
j
∂ρu ∂(ρu u ) ∂p ∂τ
i i j ij
+ = − + (3.2)
∂t ∂x ∂x ∂x
j i j
∂ρE ∂[(ρE +p)u ] ∂q ∂(u τ +Ψ )
j j i ij j
+ = − + (3.3)
∂t ∂x ∂x ∂x
j j j
Note that the kinetic energy of the fluctuating turbulent field is ignored in the definition here (it
is assumed that k (cid:191) e+ 1(u2+v2+w2)).
2
15

## 페이지 25
3.2. Favre and Reynolds (Ensemble) Averaged Equations
Define
(cid:181) (cid:182)
1 ∂u ∂u
i j
S = + (3.4a)
ij
2 ∂x ∂x
j i
(cid:181) (cid:182)
1 ∂u ∂u
i j
W = − (3.4b)
ij
2 ∂x ∂x
j i
Also, the magnitude of vorticity is
(cid:112)
Ω = 2W W (3.5)
ij ij
The shear stress terms τ is composed of a laminar and a turbulent component as
ij
τ = τL +τT (3.6)
ij ij ij
where (cid:181) (cid:182)
1∂u
τL = 2µ S − k δ (3.7)
ij ij 3∂x ij
k
For the eddy-viscosity models, the following approximations are made:
(cid:181) (cid:182)
1∂u
τT = 2µ S − k δ
ij T ij 3∂x ij
k
Ψ = 0 (3.8a)
j
for the nonlinear models,
(cid:181) (cid:182)
1∂u 2
τT = 2µ S − k δ − ρkδ +
ij T ij 3∂x ij 3 ij
k
k
2µ K (S W −W S )−
T 1 ik kj ik kj
ε
(cid:181) (cid:182)
k 1
2µ K S S − S S δ (3.9a)
T 2 ik kj kl lk ij
ε 3
(cid:181) (cid:182)
µ ∂k
T
Ψ = µ+ (3.9b)
j
σ ∂x
k j
where k is replaced by 1 when the k−ω equations rather than the k−ε equations are employed.
ε ω
For eddy-viscosity models, the end result is that the turbulent Navier-Stokes equations are
identical to the laminar equations with the exception that
µ is replaced by µ+µ
T
and
µ µ µ
T
is replaced by +
Pr Pr Pr
T
where µ is the eddy viscosity value obtained by whatever turbulence model is used, and Pr =
T
0.72,r = 0.9 . For the nonlinear models, both the above substitutions must be made and the
T
following additions as well. The term
(cid:181) (cid:182)
2 k k 1
− ρkδ +2µ K (S W −W S )−2µ K S S − S S δ
ij T 1 ik kj ik kj T 2 ik kj kl lk ij
3 ε ε 3
is added to τ in the momentum and energy equations and
ij
(cid:183)(cid:181) (cid:182) (cid:184)
µ ∂k
T
µ+
∂x σ ∂x
j k j
is added to the energy equation.
16 PMBFS2 User’s Manual

## 페이지 26
Chapter 3. Turbulence Modeling: Reynolds Averaged Navier-Stokes
3.3 Zero-equation Turbulence Closure Models
3.3.1 Baldwin-Lomax Model
The Baldwin-Lomax[2] model is not a field-equation model; it is an algebraic model.
The implementation of the original model differs in many respects from the more advanced
models[30]. First of all, it does not use the minimum distance function as its length scale, like
the other models. Instead, it uses a directed distance from the i = 1,j = 1,k = 1,i = idim,j =
jdim,k = kdim point along a constant index line. In the current implementation, if the grid
contains multiple blocks, Baldwin-Lomax should only be implemented on blocks that contain
bodies. This restriction applies to the Baldwin-Lomax model only. It does not apply to the more
general field equation models.
For the Baldwin-Lomax model,
µ = µ y ≤ y
T T,inner crossover
µ = µ y > y (3.10)
T T,outer crossover
where y is the location along the constant index line where µ exceeds µ ,
crossover T,inner T,outer
marching away from the wall. The inner eddy viscosity is
µ = ρl2Ω (3.11)
T,inner
where is the magnitude of the vorticity and
l = y[1−exp(−y+/26)] (3.12)
Since it now appears to be fairly widely accepted that the definition of y+ for the damp-
ing term needs to be modified in Baldwin-Lomax to give better answers when there are large
temperature gradients near the wall,
√
ρτ
y+ = w y (3.13)
µ
is used rather than √
ρ τ
y+ = w w y (3.14)
µ
w
The outer eddy viscosity is
µ = 0.0168(1.6)ρF F (3.15)
T,outer wake kleb
where
F = min[y F ,1.0y u2 /F ] (3.16)
wake max max max dif max
F(y) = yΩ[1−exp(−y+/26)]
Inwakes, exp(−y+/26)issettozero. F isthemaximumvalueofF(y)thatoccursinaprofile
max
and y is the value at which F occurs. Also,
max max
(cid:34) (cid:35)
(cid:181) (cid:182) −1
0.3y 6
F = 1+5.5 (3.17)
kleb
y
max
(cid:112) (cid:112)
u = ( (u2+v2+w2)) −( (u2+v2+w2))
dif max min
The second term in u is taken to be zero, except in wakes. The region for the search for F
dif max
is currently bound by
0.2η +1 < η < 0.8η +1
max max
where η, in this case, is the index direction away from the body.
PMBFS2 User’s Manual 17

## 페이지 27
3.4. One- and Two-equation Turbulence Closure Models
3.4 One- and Two-equation Turbulence Closure Models
All of the one- and two-equation model equations can be written in the general form
∂ ∂
(ρX)+ (ρu X) = S +S +D (3.18)
j P D
∂t ∂x
j
where S is a "production" source term(s), S is a "destruction" source term(s), and D repre-
P (cid:104) (cid:105) D
sentsdiffusiontermsoftheform ∂ ()· ∂X . NotethatS andS havebeengroupedtogether
∂xj ∂xj P D
ratherloosely. Insomecodes,i.e. CFL3D,theS termsaretreatedexplicitlywhiletheS terms
P D
are linearized and treated implicitly.
All of the field-equation models are solved coupled from the Navier-Stokes equations. All of
the models are solved in essentially the same fashion.
3.4.1 Spalart-Allmaras Model
The Spalart-Allmaras[45, 46] model solves a single field equation for a variable νˆ related to
the eddy viscosity through
µ = ρνˆf (3.19)
T v1
where
χ3
f = (3.20)
v1 χ3+C3
v1
νˆ
χ ≡ (3.21)
ν
The equation is
∂ρνˆ ∂
+ (ρu νˆ) = C [1−f ]ρΩνˆ (3.22)
j b1 t2
∂t ∂x
j
(cid:189) (cid:190)(cid:181) (cid:182)
1 νˆ 2
+ρ C [(1−f )f +f ] −C f
b1 t2 v2 t2 κ2 w1 w d
C ∂2νˆ
b2
− ρνˆ
σ ∂x2
j
(cid:183) (cid:184)
ρ ∂ ∂νˆ
+ (ν +(1+C )νˆ)
b2
σ∂x ∂x
j j
Also,
f = C exp(−C χ2) (3.23)
t2 t3 t4
d = distance to the closest wall = minimum distance function (3.24)
(cid:183)
1+C6
(cid:184)1
6
(cid:183)
g−6+C−6
(cid:184) −1
6
f = g w3 = w3 (3.25)
w g6+C6 1+C−6
w3 w3
g = r+C (r6−r) (3.26)
w2
νˆ
r = (3.27)
Sˆκ2d2
νˆf
Sˆ = Ω+ v2 (3.28)
κ2d2
18 PMBFS2 User’s Manual

## 페이지 28
Chapter 3. Turbulence Modeling: Reynolds Averaged Navier-Stokes
χ
f = 1− (3.29)
v2
1+χf
v1
All the formulations are employed following the reference [30]. The constants are
C = 0.1355, C = 0.622, σ = 2, κ = 0.41,
b1 b2 3
C = 7.1, C = 1.2, C = 0.5, C = 0.3, C = 2.0,
v1 t3 t4 w2 w3
C 1+C
b1 b2
C = + (3.30)
w1 κ2 σ
For the general form in eqn.(3.18):
X = νˆ (3.31a)
S = C [1−f ]ρΩνˆ (3.31b)
P b1 t2
(cid:189) (cid:190)(cid:181) (cid:182)
1 νˆ 2
S = ρ C [(1−f )f +f ] −C f (3.31c)
D b1 t2 v2 t2 κ2 w1 w d
(cid:183) (cid:184)
C ∂2νˆ ρ ∂ ∂νˆ
b2
D = − ρνˆ + (ν +(1+C )νˆ) (3.31d)
σ ∂x2 σ∂x b2 ∂x
j j j
3.4.2 k −ε Model
3.4.3 Wilcox k −ω Model
For Wilcox model[58],
(cid:183) (cid:184)
∂ρk ∂ ∂ µ ∂k
+ (ρku ) = P −β(cid:48)ρkω+ (µ+ T ) (3.32a)
j k
∂t ∂x ∂x σ ∂x
j j k j
(cid:183) (cid:184)
∂ρω ∂ ∂ µ ∂ω
+ (ρωu ) = P −βρω2+ (µ+ T ) (3.32b)
j ω
∂t ∂x ∂x σ ∂x
j j ω j
In this model, C is incorporated into the definition of , so
µ
ρk
µ = (3.33)
T
ω
The production terms are approximated by
P = µ Ω2 (3.34a)
k T
P = αρΩ2 (3.34b)
ω
The constants are
σ = 1/0.5, β = 0.075,
k
σ = 1/0.5, κ = 0.41,
ω
β κ2
α = − (cid:112) , β(cid:48) = C = 0.09 (3.35)
µ
C σ C
µ ω µ
The minimum distance function is not required by this model. However, at the present time it
is still computed and stored by the code. For the general form in eqn.(3.18):
X = k (3.36a)
k
S = µ Ω2 (3.36b)
P,k T
S = −β(cid:48)ρkω (3.36c)
D,k
(cid:183) (cid:184)
∂ µ ∂k
T
D = (µ+ ) (3.36d)
k
∂x σ ∂x
j k j
PMBFS2 User’s Manual 19

## 페이지 29
3.4. One- and Two-equation Turbulence Closure Models
X = ω (3.37a)
ω
S = αρΩ2 (3.37b)
P,ω
S = −βρω2 (3.37c)
D,ω
(cid:183) (cid:184)
∂ µ ∂ω
T
D = (µ+ ) (3.37d)
ω
∂x σ ∂x
j ω j
3.4.4 Menter’s k −ω SST Model
Menter’s k−ω model is assessed in reference [34]. The two equations for this model are
(cid:183) (cid:184)
∂ρk ∂ ∂ µ ∂k
+ (ρku ) = P −β(cid:48)ρkω+ (µ+ T ) (3.38a)
j k
∂t ∂x ∂x σ ∂x
j j k j
(cid:183) (cid:184)
∂ρω ∂ ∂ µ ∂ω
+ (ρωu ) = P −βρω2+ (µ+ T )
j ω
∂t ∂x ∂x σ ∂x
j j ω j
ρ ∂k ∂ω
+2(1−F )σ (3.38b)
1 ω2ω∂x
∂x
j j
In this model, C is incorporated into the definition of ω. The eddy viscosity is given by
µ
(cid:183) (cid:184)
ρk a ρk
1
µ = min , (3.39)
T
ω ΩF
2
The production terms are approximated by
P = µ Ω2 (3.40a)
k T
P = αρΩ2 (3.40b)
ω
The constants are calculated from φ = F φ +(1−F )φ , where the φ’s are the constants:
1 1 1 2
σ = 1/0.85, σ = 1.0,
k1 k2
σ = 1/0.5, σ = 1/0.856,
ω1 ω1
β = 0.075, β = 0.0828,
1 2
κ = 0.41, a = 0.31,
1
β(cid:48) = C = 0.09
µ
β κ2 β κ2
1 2
α = − (cid:112) , α = − (cid:112) (3.41)
1 2
C σ C C σ C
µ ω1 µ µ ω2 µ
F = tanh(Γ4)
1
Γ = min[max(Γ ,Γ ),Γ ]
1 3 2
√
500ν 4ρσ k k
2
Γ = , Γ = , Γ = ,
1 d2Ω 2 d2(CD ) 3 C ωd
k−ω µ
(cid:181) (cid:182)
ρ ∂k ∂ω
CD = max 2σ ,1×10−20 ,
k−ω 2
ω∂x ∂x
j j
F = tanh(Π)
2
Π = max(2Γ ,Γ ) (3.42)
3 1
20 PMBFS2 User’s Manual

## 페이지 30
Chapter 3. Turbulence Modeling: Reynolds Averaged Navier-Stokes
For the general form in eqn.(3.18):
X = k (3.43a)
k
S = µ Ω2 (3.43b)
P,k T
S = −β(cid:48)ρkω (3.43c)
D,k
(cid:183) (cid:184)
∂ µ ∂k
T
D = (µ+ ) (3.43d)
k
∂x σ ∂x
j k j
X = ω (3.44a)
ω
S = αρΩ2 (3.44b)
P,ω
ρ ∂k ∂ω
S = −βρω2+2(1−F )σ (3.44c)
D,ω 1 ω2ω∂x
∂x
j j
(cid:183) (cid:184)
∂ µ ∂ω
T
D = (µ+ ) (3.44d)
ω
∂x σ ∂x
j ω j
PMBFS2 User’s Manual 21

## 페이지 31
3.4. One- and Two-equation Turbulence Closure Models
22 PMBFS2 User’s Manual

## 페이지 32
Chapter 4
Turbulence Modeling: Large-Eddy
Simulation
Turbulenceremainsachallengeinfluidmechanicsresearchduetoitsstrongnonlinearbehav-
ior, although this topic has been studied for more than one hundred years. Numerical simulation
of turbulent motions can be classified into three major categories, as illustrated in Fig. 4.1.
Figure 4.1: Concepts of DNS, LES and RANS, where P(k): turbulent energy production, D(k):
turbulent energy dissipation.
The most straightforward method is direct numerical simulation (DNS). Given sufficient
computing resources, the equations governing flow evolution can be solved without any model,
and the entire spectrum of turbulence scales is resolved explicitly. DNS is the most accurate
numerical tool for studying turbulence; however, its computational cost increases rapidly with
the Reynolds number (approximately Re3 ). This approach is restricted to flows with low-
to-moderate Reynolds number. The burden for directly simulating most practical engineering
problems is far beyond the current computer capabilities.
TheReynolds-averagedNavier-Stokesequations(RANS)havebeenusedformostengineering
applications. In RANS model, the Reynolds equations are solved to determine the mean flow
fields. The computational cost for RANS models is much less than that for DNS because of its
lower grid resolution requirement. However, owing to the distinctive behavior between large-
and small-scale turbulent motions, it is impossible to achieve a universal model that can cover
all turbulent flows (Piomelli, 1999).
Large-eddy-simulation (LES) (Deardorff, 1970) is an intermediate approach between the two
aforementionedmethods. InLES,thedynamicsofthelarge,energy-carryingflowmotions,which
are affected by the geometry and flow conditions and are not universal, is computed exactly,
and only the effect of the smallest scales of turbulence is modeled (Piomelli, 1999). Since the
small-scale flow motions tend to be more homogeneous and universal, and less affected by the
boundary conditions than the large-scale ones, their models can be simpler and require fewer
23

## 페이지 33
adjustmentsfordifferentflowsincomparisonwiththemodelsforRANSsimulation(Pope,2000).
Similar to DNS, LES provides a three-dimensional, time-dependent solution of the governing
equations. However, because only the energy containing flow motions is resolved in LES, the
vast computational cost of explicitly representing the smallest-scale motions is avoided.
For the three-dimensional flows generally encountered in engineering applications, the nu-
merical task of solving the LES equation is still substantial. Although many commercial CFD
codes (i.e. Fluent) offer a LES function, the calculations, based on the grids generally employed,
are very-large-eddy-simulation (VLES). In LES, the filtered velocity field accounts for the bulk
turbulent kinetic energy everywhere in the flowfield, whereas, the grid and filter of VLES are
too large to resolve the energy-containing motions, and instead a significant portion of energy
resides in the residual motions. VLES can be performed on coarse grids, and therefore is less ex-
pensive. The simulation, however, is strongly dependent on the modeling of the residual motions
(Piomelli, 1999; Pope, 2000).
InLES,becausethedissipativescalesofturbulencearenotadequatelyortotallynotresolved,
subfilterscale(SFS)orsubgridscalemodelingisrequired. TheroleoftheSFSmodelistomimic
the drain of energy through energy cascade, thereby, to transfer energy from the resolved scales
totheunresolvedsubfilterscales. Inotherword,theeffectsofunresolvedscalesonresolvedscales
should be modeled. Many SGS models have been developed since the late 1980s. Commonly
used SGS models include the Smagorinsky eddy viscosity model, dynamic eddy viscosity model,
similarity and mixed model.
The Smagorinsky SGS model (Smagorinsky, 1963) is widely used because of its simplicity.
It can predict fairly accurately the integral scale flow motions and global dissipation when the
grid is sufficiently fine to resolve most energy containing motions. This model, however, has
obvious deficiencies. Firstly, an empirical model coefficient, which actually is flow and filter-
width dependent (Pope, 2000), is required as initial input. Thus, the optimal model constant
must be changed in different flows. Secondly, this model does not have the correct limiting
behavior near the wall (Junela and Brasseur, 1999). Actually, as will be discussed in detail
hereafter, all eddy-viscosity and similarity SFS models inherent possess the same problem in
the near wall region (Junela and Brasseur, 1999). Thirdly, for laminar shear flow or viscous
sub-layers close to the solid wall, in which the residual stresses are zero, the Smagorinksy model
givesrisetospuriousresidualstressestensor. Finally, themodeldoesnotaccountforbackscatter
of energy from small to large scales, which has been shown to be of importance in the transition
region.
To avoid the empirical coefficients in the algebraic Smagorinsky model, a dynamic eddy
viscosity model (Germano et al., 1991) was proposed. In this model, the Smagorinsky coefficient
is determined from the resolved-scale information, which is allowed to vary in both time and
space. This is achieved by filtering the resolved-scale velocity with a test-filter at a scale larger
than the effective LES filter. The coefficients of the dynamic model are assumed to be the same
in both filters and are computed dynamically during the calculation. When model coefficient
is negative, backscatter of energy occurs. The dynamic model can yields good predictions of
energy transferring at the local level, and the residual stresses vanish in laminar flows. However,
in this procedure, an additional spatial averaging is performed to avoid excessive fluctuations in
the calculated model coefficients, which reduces its spatial variability (Moin, 1991).
Aweaknessofalleddyviscositymodelsisthattheyassumetheresidualstressisproportional
to strain rate tensor (It turns the principle axis of the strain-rate and residual stress tensor to
align.). A scale-similar model was introduced by Bardina et al. (1980) to solve this problem. A
dynamic mixed model with a scale-similar part was applied by Zang et al. (1993). Unlike eddy
viscositymodelswhichcloseonlythedeviatoricpartofSGSstresstensor, similaritymodelsclose
24 PMBFS2 User’s Manual

## 페이지 34
Chapter 4. Turbulence Modeling: Large-Eddy Simulation
the full SGS stress tensor. This kind of model was been proof to be very successful in simulation
the turbulent-mixing layer (Vreman, 1997).
As mentioned above, both eddy viscosity and similarity models inherently possess a signifi-
cant deficiency in simulation the rough wall boundary layer (Juneja and Brasseur, 1999). The
error may arise from the poor performance of algebraic SFS model at the first several grid levels,
where integral scales are necessarily under-resolved and the turbulence is highly anisotropic. Un-
der this condition, the models create a spurious feedback loop between predicted resolved-scale
(RS) velocity and modeled SFS acceleration, and are unable to simultaneously capture SFS ac-
celeration and RS-SFS energy flux. To fix this problem, Zhou et al. (2001) introduced a new
modeling strategy in which the grid-resolved subfilter velocity is estimated from a separate dy-
namical equation containing the essential inertial interactions between subfilter-scale and resolve
scale (RS) velocities. This method successfully suppresses the spurious feedback loop between
RS velocity and SFS acceleration, and greatly improves the predictions of anisotropic structures
and resolved velocity fields. The resolvable subfilter-scale (RSFS) model accurately captures
SFS acceleration intensity and RS-SFS energy flux, even during the nonequilibrium transient
(Zhou et al., 2001). There are still many other types of SFS models, such as Lagrangian dy-
namic model (Meneveau et al., 1996) and Monotonically Integrated LES (MILES) (Fureby and
Grinstein, 1999; 2002; Grinstein et al., 2002), which can not be discussed in detail herein.
The successful application of LES depends not only on SFS model, but also relies heavily on
many other important issues (Moin, 2002), including filtering and governing equation, wall layer
modeling, accuracyofnumericalalgorithm, andboundaryconditions. Thescopeissobroadthat
far beyond the contents of this brief section. The comprehensive review on LES can be found in
Piomelli (1999) and Moin (2002).
4.1 Spatial Filtering
In large-eddy-simulation, a spatial filtering operation is performed so that the resulting fil-
tered velocity field can be adequately resolved on a relative coarse grid. Specifically, the required
grid spacing is proportional to the filter width. A filtered (or resolved) variable is defined as
(cid:90)
f(x) = f(x)G (x−x(cid:48))dx(cid:48) (4.1)
f
∞
(cid:82)
where G is the filter function and G (x)dx = 1. Leonard (1974) indicated that if G is
f f
∞
only a function of x−x(cid:48), the differentiation and filtering operations could commute with each
other. Commutation of the filtering operation with spatial differentiation is strictly valid only
for uniform grid systems (Ghosal and Moin, 1995; Ven, 1995). The commutation error is usually
neglected for moderately stretched grids, and can be lumped with the subgrid model (Ribault et
al.,1999;Moin,1997). Themodelingerrorisfoundtobegenerallysmallerthanthediscretization
error (Ribault et al., 1999).
The filter function G could be any function defined in an infinite domain and satisfies the
following requirements:
G(x) = G(−x);
(cid:82)
G (x)dx = 1;
f
∞(cid:82)
G (x)|x|ndx < ∞,∀n ≥ 0; and
f
∞
G(x) is small while|x| > ∆.
PMBFS2 User’s Manual 25

## 페이지 35
4.2. Filtered Governing Equations
where ∆ stands for the filter size. The most commonly used filter functions are summarized as
follows:
• Tophat
This filter is popularly employed in the physical space, defined as
(cid:189)
1/∆ if x ≤ ∆/2,
G (x) = (4.2)
f 0 otherwise.
For example, in the finite-volume approach, the cell-averaged variables are defined as
(cid:90)
1
f = f(x)dx (4.3)
∆V
∆V
Thus, the cell average in the finite volume method, which will be implemented in the
current study, belongs to the Top-hat filter
• Gaussian filter
The Gaussian filter function is the Gaussian distribution with zero mean and variance
σ2 = ∆212 (cid:114) (cid:181) (cid:182)
6 6|x|2
G (x) = exp − (4.4)
f π∆2 ∆2
• Cutoff Filter
(cid:189)
1 if k ≤ π/∆,
G(cid:98) (k) = (4.5)
f 0 otherwise.
The cutoff filter is a tophat filter in spectral space. A detailed description of properties of
various filters can be found in the textbook (Pope, 2000).
4.2 Filtered Governing Equations
To capture all of the flow scales resolved by a given grid system, and to model the effects
of unresolved scales, the concepts of decomposition and filtering are introduced. Based on the
Favre-averaging (Favre, 1969), any instantaneous variable (f) can be expressed as the sum of a
Favre-averaged filtered scale (f(cid:101)) and a sub-filter scale (f(cid:48)(cid:48))
f = f(cid:101)+f(cid:48)(cid:48) (4.6)
where
ρf
f(cid:101)= (4.7)
ρ
Because of f(cid:48) (cid:54)= 0 and f(cid:102)(cid:48)(cid:48) (cid:54)= 0 in this spatial filtering process, the filter operation in LES is
different from the conventional Reynolds average in time domain. Therefore, the relationships
derived from the time averaging in the RANS concept are not always true in the filter operations
of LES (see Appendix A).
26 PMBFS2 User’s Manual

## 페이지 36
Chapter 4. Turbulence Modeling: Large-Eddy Simulation
The filtered Favre-averaged mass, momentum, energy and species conservation equations can
be written as
∂ρ ∂ρu(cid:101)
j
+ = 0 (4.8)
∂t ∂x
j
∂ρu(cid:101) i ∂(ρu(cid:101) i u(cid:101) j +pδ ij ) ∂(τ(cid:101) ij −τ i s j gs)
+ = (4.9)
∂t ∂x ∂x
j j
(cid:195) (cid:33)
∂ρE(cid:101) ∂[(ρE(cid:101)+p)u(cid:101) ] ∂ ∂T(cid:101)
+ j = u(cid:101) τ(cid:101) +λ −Hsgs+σsgs (4.10)
∂t ∂x ∂x i ij ∂x j j
j j j
∂ρY(cid:101) ∂ρY(cid:101) u(cid:101) ∂ (cid:179) (cid:180)
k + k j = −ρV(cid:101) Y(cid:101) −Φsgs−Θsgs +ω˙ , k = 1,...,N (4.11)
∂t ∂x ∂x k,j k k,j k,j k
j j
The unclosed sub-filter terms are defined:
τsgs = (ρu u −ρu(cid:101) u(cid:101) ) (4.12a)
ij i j i j
Hsgs = (ρEu −ρE(cid:101)u(cid:101) )+(pu −pu(cid:101) ) (4.12b)
j j j j j
σsgs = (u τ −u(cid:101) τ(cid:101) ) (4.12c)
ij j ij j ij
Φsgs = (ρY u −ρY(cid:101) u(cid:101) ) (4.12d)
k,j k j k j
Θsgs = (ρY V −ρY(cid:101) V(cid:101) ) (4.12e)
k,j k k,j k k,j
TheSGSstressestermτsgs,SGSenergyfluxestermHsgs andSGSspeciesfluxesΦsgs resultfrom
ij j k,j
filtering these convective terms. The SGS viscous work term, σsgs , comes from correlations of
ij
the velocity field with the viscous stress tensor, and the SGS species diffusive fluxes term, Θsgs,
k,j
comes from correlations of the velcity field with the species mass fractions with the diffusion
velocities. The resolved-scale species mass production rate, ω˙ , is also unclosed. The modeling
k
of these SGS terms is discussed in detail in the following subsections.
In addition to the conservation equations, the equation of state must be filtered.
Real fluid case:
Filtering the equation of state gives us
p = R Z(cid:101)ρT(cid:101)+R (Z(cid:93)ρT −Z(cid:101)ρT(cid:101)) (4.13)
u u
where Z is the compressibility factor. The first term on the right hand side uses only resolved
variables (i.e. Z(cid:101),ρ,T(cid:101) ) and can be computed directly. The second term includes a correlation of
the temperature, compressibility, and density (ZρT). This term is difficult to model. For ideal
gas (Z = 1) with low heat release, this term is negligible (Calhoon and Menon, 1996). This may
be not true for high-pressure real-fluid mixture. Tramecourt et al. (2004) recently evaluated
the contributions of the two terms in the directly simulation of supercritical heptane/nitrogen
mixing layer. They reported that the contribution of the second terms was always less than 0.2%
of that of the first term. Based on this observation, the second term is neglected in the present
simulation.
The filtered total energy E(cid:101) can be approximated as
(cid:34) (cid:35)
(cid:90) (cid:181) (cid:182)
p(cid:101) u(cid:101)2 p 1 T ∂ρ p(cid:101) u(cid:101)2
E(cid:101) =(cid:101)h− + k +Ksgs = Ψ(cid:101) + + dp− + k +Ksgs (4.14)
ρ 2 ρ ρ2 ∂T ρ 2
p0 p
(cid:80)
where Ψ = N Y ∆h0 , and Ksgs = τsgs/2ρ = 1(ρu u /ρ−u(cid:101)2).
k=1 k f,k kk 2 k k k
PMBFS2 User’s Manual 27

## 페이지 37
4.3. Subgrid-Scale Models
Perfect gas case:
Filtering the equation of state gives us
(cid:88)N Y(cid:101) (cid:88)N Tsgs
p = ρR T(cid:101) k +ρR k (4.15)
u u
W W
k k
k=1 k=1
where Tsgs = ρTY /ρ−T(cid:101)Y(cid:101) . For low heat release, the correlation Tsgs can be expected to be
k k k k
negligible. However, this may be not true for high heat release cases. Due to the difficulty and
uncertaintyinmodelingofthiscorrelation, itisneglectedwithoutanyjustificationinthecurrent
study (Calhoon and Menon, 1996).
The filtered total energy E(cid:101) can be approximated as
(cid:90)
p(cid:101) u(cid:101)2 T p(cid:101) u(cid:101)2
E(cid:101) =(cid:101)h− + k +Ksgs = Ψ(cid:101) + C (T(cid:48))dT(cid:48)− + k +Ksgs (4.16)
p
ρ 2 ρ 2
Tref
4.3 Subgrid-Scale Models
The SGS modeling for the unresolved terms in Eqs. 4.12 is one of the important issues in
LES.Becausethesmalleddies,whicharelessthanthefiltersizeandunresolvedinLES,dissipate
most turbulent kinetic energy, SGS models are introduced to allow for the transferring of energy
from resolved to unresolved scales and to mimic the drain of energy associated with the energy
cascade. Most of the SGS models are based on an eddy-viscosity type model, in which the SGS
stress τsgs is related to the large-scale strain-rate tensor S(cid:101) as follows:
ij ij
δ
τsgs− ij τsgs = −2ν S(cid:101) (4.17)
ij 3 kk T ij
where ν is the eddy viscosity and S(cid:101) = 1( ∂uej + ∂uei).
T ij 2 ∂xi ∂xj
4.3.1 Algebraic Smagorinsky Type Model
In this kind of model, the eddy viscosity ν is obtained algebraically to avoid solving ad-
T
ditional equations. Usually the equilibrium hypothesis is made to simplify the problem and to
obtain an algebraic model. The equilibrium hypothesis assumes that small-scale motions, which
have shorter time scales than the large, energy-carrying eddies, can adjust more rapidly to per-
turbations and recover equilibrium nearly instantaneously. Under this assumption, a balance
exists between the SGS kinetic energy production term and the viscous dissipation rate term:
−τ S(cid:101) = ε .
ij ij ν
The Smagorinsky model based on the equilibrium hypothesis is written
ν = (C ∆)2|S(cid:101)| (4.18)
T s
where ∆ is the filter width and S(cid:101) = (2S(cid:101) S(cid:101) )1/2. The filter width is chosen as (∆∀)1/3, where
ij ij
∆∀ is cell volume. The coefficient C can be specified from the isotropic turbulence decay or a
s
prioric test. Erlebacher et al. (1992) extended the above model to include flow compressibility
S(cid:101) δ 2
τsgs = −2ν ρ(S(cid:101) − kk ij + ρKsgsδ (4.19)
ij T ij 3 3 ij
ν = C (∆D)2|S(cid:101)| (4.20)
T R
28 PMBFS2 User’s Manual

## 페이지 38
Chapter 4. Turbulence Modeling: Large-Eddy Simulation
Ksgs = C (∆D)2S(cid:101) S(cid:101) (4.21)
I ij ij
wherethedimensionlessquantitiesC andC representthecompressibleSmagorinskyconstants.
R I
The Van-Driest damping function (D) is used to take into account the inhomogeneities near the
wall (Moin and Kim, 1982), and is expressed as
D = 1−exp(1−(y+)3/263) (4.22)
where y+ = yu /ν and u is friction velocity.
τ τ
Since no chemical reaction is considered in the present simulation, the subgrid energy flux
(Hsgs) and the convective species flux (Φsgs) terms is modeled based on the gradient transport
j k,j
assumption (Oefelein and Yang, 1998)
(cid:195) (cid:33)
ν ∂(cid:101)h ∂u(cid:101) 1∂Ksgs
Hsgs = −ρ T +u(cid:101) i + (4.23)
j Pr ∂x i ∂x 2 ∂x
T j j j
where Pr represents the turbulent Prandtl number, a standard value 0.7 is used (Zang et al.,
T
1992). The SGS viscous work term, τsgs, is neglected due to its small contribution to the total
ij
energy equation (Martin et al., 1999)
The convective species flux term (Φsgs) is usually approximated as
k,j
ν ∂Y(cid:101)
Φsgs = −ρ T k (4.24)
k,j Sc ∂x
T j
where Sc is the turbulent Schmidt number. It should be noted that the use of the gradient
T
transport assumption for reactive species is questionable. The SGS species diffusive fluxes term,
Θsgs, usually is neglected (Calhoon and Menon, 1996; Oefelein and Yang, 1998).
ij
ThealgebraicSmagorinskytypemodeldescribedaboveisthemostwidelyusedmodelinLES.
However, as pointed out by Moin et al. (1991), it has several limitations. First, the optimal
model constant must be changed for a different class of flows. Second, the model does not have
the correct limiting behavior near a wall (Juneja and Brasseur, 1999). The SGS stress does not
vanish in laminar flow and the model is found to be very dissipative in the laminar/transition
region. Themodeldoesnotaccountforthebackscatterofenergyfromsmalltolargescale, which
has been shown to be of importance in the transition region.
4.3.2 Dynamic Smagorinsky Model
The dynamic model introduced by Germano et al. (1991) improves some of the aforemen-
tioned deficiencies in algebraic models. The dynamic model uses the assumption of scale in-
variance by applying the coefficient measured from the resolved scales to the SGS range. It
calculates the model coefficients dynamically from the information already contained in the re-
solved velocity field during the simulation (rather than treating it as an adjustable parameter
as in the standard Smagorinsky model). The dynamic model uses resolved-scale information at
the grid-filter level and a coarser test-filter G(cid:98) with characteristic ∆(cid:98) > ∆ (typically, ∆(cid:98) = 2∆) in
f
order to compute the model parameters C and C as a function of space and time (Germano
R I
et al., 1991). Formally, the dynamical procedure is based on the Germano identity (Germano,
1992)
L = T − < τsgs > (4.25)
ij ij ij
←→←→ ←→←→
where L =< ρu(cid:101) u(cid:101) > − < ρ > u(cid:101) u(cid:101) and T =< ρu u > − < ρ > u(cid:101) u(cid:101) . Here a Favre-filtered
ij i j i j ij i j i j
←→
variable under a test-filter is defined as f(cid:101) =< ρf > / < ρ >. The brackets < . > denote the
PMBFS2 User’s Manual 29

## 페이지 39
4.4. Hybrid RANS/LES
averaging operation based on the test filter. The following expressions can be derived for the
dynamic evaluation of C and C using the least square minimization approach of Lilly (1992)
R I
for the momentum SGS stress tensor.
< L M > 1< L M >
ij ij α mm nn α
C = − (4.26)
R
< M M > 3 < M M >
kl kl α kl kl α
< L >
kk α
C = (4.27)
I
< β− < α >>
α
where < · > denote an appropriate spatial average, generally taken over the homogeneous
α
directions to ensure the numerical stability (Moin et al. 1991; Germano et al, 1991; Lilly, 1992).
This additional averaging reduces the spatial variability of the model constant.
The forms of M ,β and α are given as follows
ij
M = β − < α > (4.28)
ij ij ij
←→ ←→ ←→
δ δ
β = −2∆(cid:98)2 < ρ > | S(cid:101)|(S(cid:101) − ij S(cid:101) ); α = −2∆2ρ|S(cid:101)|(S(cid:101) − ij S(cid:101) ) (4.29)
ij ij kk ij ij kk
3 3
←→
β = 2∆(cid:98)2 < ρ > | S(cid:101)|2; α = 2∆2ρ|S(cid:101)|2 (4.30)
The same idea for modeling the SGS turbulent stress can be employed to dynamically calculate
the turbulent Prandtl number and Schmidt number in Eq. 4.23 and Eq. 4.24 (Wang, 2002).
We implemented the algebraic Smagorinsky model in the current study although it may not
be the best SGS model. There are two reasons: first, the best SGS model for real-fluid flows is
still unknown; and second, the grid requirement for other models such as the dynamical model is
normally stricter than the algebraic Smagorinsky model due to its double filters, both of which
are required to be located in the inertial range.
4.4 Hybrid RANS/LES
Hybrid RANS/LES method is a modification of a RANS model in which the model switches
to a subgrid scale formulation in regions fine enough for LES calculations. Regions near solid
boundaries and where the turbulent length scale is less than the maximum grid dimension are
assigned the RANS mode of solution. As the turbulent length scale exceeds the grid dimension,
the regions are solved using the LES mode. Therefore the grid resolution is not as demanding
as pure LES, thereby considerably cutting down the cost of the computation. Though detached-
eddy-simulation (DES) was initially formulated for the Spalart-Allmaras model (Spalart et al,
1997[47]), it can be implemented with other RANS models (Strelets, 2001[48]), by appropriately
modifying the length scale which is explicitly or implicitly involved in the RANS model. So
while Spalart-Allmaras model based DES acts as LES with a wall model, DES based on other
models (like two equation models) behave as a hybrid RANS-LES model. Grid generation is
more complicated than for a simple RANS or LES case due to the RANS-LES switch. DES is
a non-zonal approach and provides a single smooth velocity field across the RANS and the LES
regions of the solutions.
The motivation of detached-eddy simulation (DES) is to combine the best features of both
LES and RANS methods. RANS has the advantage of predicting attached flows very well with
relatively low computation cost. LES, on the other hand, can predict separated flows more
accurately though it has expensive computation cost for boundary-layer flows. This idea was
originally applied to the Spalart-Allmaras one-equation RANS turbulence model, where the
30 PMBFS2 User’s Manual

## 페이지 40
Chapter 4. Turbulence Modeling: Large-Eddy Simulation
distance to the closest wall (d) is replaced by the new DES length scale (d˜). The length scale is
based on the grid spacing ∆ and is defined as
d˜= min(d,C ∆), ∆ = max(∆x,∆y) (4.31)
DES
where C is the DES model constant, and d˜is base on the largest dimension of the local grid
DES
cell. For wall bounded separated flows, the hybrid model acts as a standard RANS S-A model
in the boundary layer (d (cid:191) d˜), and as its subgrid-scale version in the detached regions (d (cid:192) d˜).
Strelets(2001)[48]introducedaDESmodelbasedonMenter’sSSTtwo-equationmodel. The
RANS length scale in the SST model, l = k1/2/(β∗ω), is replaced by a DES length scale,
k−ω
˜l = min(l ,C ∆), and the resulting sub-grid model reduces into a Smagorinsky-like model.
k−ω DES
According to this statement, the dissipative term of the k-transport equation is modified to
transform the SST model into the DES mode:
Dk = ρk3/2/˜l (4.32)
DES
Since Menter’s SST model is based on a blending of k−(cid:178) and k−ω model, the value of the
DES constant C is determined with the traditional blending function F :
DES 1
C = (1−F )Ck−ε +F Ck−ω (4.33)
DES 1 DES 1 DES
where Ck−ε = 0.61 and Ck−ω = 0.78 are separate calibrations for the corresponding model
DES DES
on isotropic turbulence. The recommended turbulence model constants are used in the current
study.
PMBFS2 User’s Manual 31

## 페이지 41
4.4. Hybrid RANS/LES
32 PMBFS2 User’s Manual

## 페이지 42
Chapter 5
Chemical Equilibrium and
Non-Equilibrium Modeling
The use of steady-state RANS models has been and will continue to be the tool of choice for
modeling compressible reacting flows for high-speed commercial and military applications. Even
with expected increases in computer speed, the role of LES will likely be limited to idealized
component analysis, or to scenarios where flow unsteadiness is of special concern. Hence, im-
provements to modeling approaches for compressible reacting flows within a RANS framework
offers the greatest potential advancement to CFD practitioners. Of the issues raised in this
document, improvements to the turbulent scalar transport models are likely to reap the most
benefits.[3]
Figure 5.1: The combustion models are classified on their capability to deal with the different
combustion regimes.
5.1 Chemical Kinetics
To obtain the expression for the chemical reaction source term, consider an L-step reaction
mechanism with N species, which can be written as (Kuo, 1986)
(cid:88)N (cid:88)N
ν(cid:48) χ ⇐
kf⇒i
ν(cid:48)(cid:48)χ , i = 1,2,...,L (5.1)
ki k ki k
kbi
k=1 k=1
33

## 페이지 43
5.1. Chemical Kinetics
whereν(cid:48) andν(cid:48)(cid:48) arethestoichiometriccoefficientsonthereactantsandproductssideforspecies
ki ki
k inthei-threaction. χ representsthechemicalformulaofspeciesk. k andk arethereaction
k fi bi
rate constants of the forward and backward reactions, respectively. They may take the following
form
k (T) = A Tbexp(−E /R T) (5.2)
i i i u
where A,b, and E are empirical parameters and E represents the activation energy of reaction
i i
i. The following relationship expresses the net production rate ω˙ of each species in a multi-step
k
mechanism
(cid:34) (cid:35)
(cid:88)L (cid:89)N (cid:89)N
ω˙ k = W k (ν k (cid:48)(cid:48) i −ν k (cid:48) i ) k fi [χ k ]ν k (cid:48) i −k bi [χ k ]ν k (cid:48)(cid:48) i , k = 1,2,...,N (5.3)
i=1 k=1 k=1
whereW and[χ ]representthemolecularweightandmolarconcentrationofspeciesk. Notethat
k k
the expression for the net production rate, Eq. 5.3, is valid only for elementary reactions. Since
some researchers may use a global kinetic mechanism, the exponents for molar concentrations
may differ from their stoichiometric coefficients.
For the ethylene/air system, the two-step global kinetics scheme proposed by Westbrook and
Dryer (1981) is adopted in light of its simplicity and reasonably accurate modeling of burned
gases containing incompletely oxidized species of hydrocarbon fuels.
The scheme for ethylene oxidation involves the following two steps and five species:
C H +2O → 2CO+2H O (5.4a)
2 4 2 2
1
CO+ O → CO (5.4b)
2 2
2
The rate of the ethylene oxidation per unit volume is expressed as
(cid:181) (cid:182)
−E
ω˙ = −A exp a1 [χ ]0.1[χ ]1.65 (5.5)
f1 1
R T
C2H4 O2
u
The rate of the CO oxidation per unit volume is
(cid:181) (cid:182)
−E
ω˙ = −A exp a2 [χ ]1[χ ]0.5[χ ]0.25 (5.6)
f2 2
R T
CO H2O O2
u
Inordertoreproduceproperlyboththeheatofreactionandpressuredependenceofthe[CO]/[CO2]
equilibrium, a reverse reaction is included for the second step, Eq. (5.4b):
(cid:181) (cid:182)
−E
ω˙ = −B exp a2 [χ ]1 (5.7)
r2 2
R T
CO2
u
In the above expressions, [χ ], [χ ], [χ ], [χ ], and [χ ] represent the molar concen-
C2H4 O2 CO CO2 H2O
trations of species C2H4, O2, CO, CO2, and H2O, respectively. The pre-exponential factors
are taken as A = 1.12468×1010(kmol/m3)−0.75s−1, A = 2.23872×1010(kmol/m3)−0.75s−1,
1 2
B = 5×108s−1, and the activation energies are E = 125.52kJ/mol and E = 167.36kJ/mol.
2 a1 a2
For the kerosene/air system, the one-step and two-step global kinetics schemes proposed
by Westbrook and Dryer (1981) are adopted in light of its simplicity and reasonably accurate
modeling of burned gases containing incompletely oxidized species of hydrocarbon fuels. The
one-step scheme for kerosene oxidation can be written as:
34 PMBFS2 User’s Manual

## 페이지 44
Chapter 5. Chemical Equilibrium and Non-Equilibrium Modeling
C H +18O → 12CO +12H O (5.8)
12 24 2 2 2
The formulation by Arrhenius law is expressed as
(cid:181) (cid:182)
−E
k = −ATBexp a [χ ]α[χ ]β (5.9)
R T
C12H24 O2
u
where A = 2.587×1011(mol/cm3)−0.75s−1,B = 0,E = 30kcal/mol,α = 0.25,β = 1.5.
a
The two-step scheme for kerosene oxidation can be written as:
C H +12O → 12CO+12H O (5.10a)
12 24 2 2
1
CO+ O → CO (5.10b)
2 2
2
and the formulation by Arrhenius law is expressed as
(cid:181) (cid:182)
−E
k = −A exp a1 [χ ]0.25[χ ]1.5,k = 0
f1 1
R T
C12H24 O2 b1
u
(cid:181) (cid:182) (cid:181) (cid:182)
−E −E
k = −A exp a2 [χ ]1[χ ]0.5[χ ]0.25,k = −B exp a2 [χ ]1
f2 2
R T
CO H2O O2 b2 2
R T
CO2
u u
5.2 Turbulent Combustion Models
The interaction between turbulence and chemistry is an important issue for numerical study
of turbulence combustion. The effect of turbulent mixing on combustion is taken into account
by means of the Eddy-Dissipation Model (EDM) proposed by Magnussen and Hjertager (1976).
In this model, the reaction rate associated with turbulent mixing, is given by the minimum of
the following three rates:
ω˙ = −a[χ ](ε/k) (5.11)
F F
a
ω˙ = − [χ ](ε/k) (5.12)
O
ν
O2
ab
ω˙ = − [χ ](ε/k) (5.13)
P P
1+ν
where [χ ], [χ ], and [χ ] represent the molar concentrations of the fuel, oxygen, and product
F O2 P
species, respectively, a and b are two empirical constants taken to be 4.0 and 0.5, respectively,
(cid:178)/k the fluctuation frequency, and ν the stoichiometric mass ratio of oxygen to fuel. Combined,
the actual reaction rate of a given species is determined by the smaller of that based on the
finite-rate chemical kinetics, Eqs. (5.5)-(5.7), and that based on the eddy-dissipation model,
Eqs. (5.11)-(5.13).
Recently, there were many attempts to address this issue using LES methods, PDF ap-
proaches, and other combustion models extended from subsonic combustion conditions.
Although much useful advances were achieved, the improvement was insignificant in com-
parison with the results obtained from laminar chemistry and experimental data, as discussed
by Mo¨bus et al (2003). A careful review of existing results, such as Norris and Edwards (1997)
PMBFS2 User’s Manual 35

## 페이지 45
5.2. Turbulent Combustion Models
suggeststhatthesolutionaccuracyseemstobemoredependentongridresolutionthanthemod-
eling of turbulence-chemistry interaction. In view of the lack of reliable models for turbulence-
chemistry interactions, especially for supersonic flows, the effect of turbulence on chemical reac-
tion rate is ignored. It may be, however, accommodated in the future work.
36 PMBFS2 User’s Manual

## 페이지 46
Chapter 6
Multi-Phase Modeling
6.1 Hierarchy of Multi-Phase Models
Three regimes of flow development are commonly observed inside two-phase flows (as shown
inFig. 6.1): 1) ‘primary breakup regime’and ‘dense regime’, where the liquid film exhibits
large scale coherent structures that interact with the gas-phase and disintegrate into filaments
by forming Kelvin-Helmholtz type instability, 2) ‘intermediate regime’ where the liquid blobs
formedundergosecondary breakup, and3)‘dilute regime’wherethedropletsevaporate, the
fuelvapormixeswiththesurroundinghotgasgivingturbulentsprayflames. Dropletdeformation
and collision are also important features in the intermediate regime. Figure 6.1 summarizes
the characterization of the spray formation into the three regimes, based on the ratio of the
characteristic length scale of the liquid to the available grid resolution l/∆x and the liquid phase
volume fraction Θ .
p
dilute regime
intermediate regime
dense regime
primary breakup
`/∆x > 1
Θ p = O(1) `/∆x < 1
Θ = O(1) `/∆x << 1
p Θ p << 1 `/∆x << 1
Θ << 1
p
Figure 6.1: Regimes of spray formation defined by the ratio of the characteristic length scale of
the liquid, l, to the local grid spacing, ∆x and the liquid phase volume fraction, Θ .
p
A “hierarchy of two-phase models” that can be used to study the hydrodynamic behaviour
of two-phase flows typically consists of Eulerian-Eulerian two fluid models, Eulerian-Lagrangian
models and interface tracking or capturing models.
37

## 페이지 47
6.1. Hierarchy of Multi-Phase Models
Eulerian-Eulerian two fluid models
The Eulerian-Eulerian two fluid model uses the volume averaged mass- and momentum con-
servation equations to describe the time-dependent motion of both the gas and the liquid phase.
For multiphase isothermal systems involving laminar flow, these volume-averaged conservation
equations are respectively given by
∂ρ
k
+∇·ρ u = R (6.1)
k k k
∂t
∂ρ u
k k
+∇·ρ u u = −ε ∇p−∇·ε τ
k k k k k k
∂t
(cid:88)N
+ M +R u +S (6.2)
kl k k k
l=1
whereρ ,u ,ε ,τ represent, respectively, themacroscopicdensity, velocity, volumefractionand
k k k k
viscous stress tensor of the kth phase, p the pressure, R a source term describing mass exchange
k
between phase k and the other phases, M the interphase momentum exchange term between
kl
phase k and phase l and S a momentum source term of phase k due to external forces.
k
A two fluid model will typically be used to study the large-scale flow structures prevailing
in dense pahse because of its computational efficiency (compared to, for instance, Eulerian-
Lagrangian models). A disadvantage of a Two Fluid model is the need for appropriate closure
lawsfortheinterphasetransportofmass,momentumandheat. Thecorrectformoftheseclosure
laws is still being debated. Also, care must be taken to limit numerical diffusion, for instance, by
applyingtheTVDschemeinsteadoftheUPWINDschemeforthefinite-differenceapproximation
of the convective fluxes (Sokolichin et al., 1997).
Eulerian-Lagrangian models
In dispersed gas-liquid two-phase flows an alternative to the complete continuum representa-
tionispossiblebyadoptingaLagrangiandescriptionforthedispersedphase. IfsuchaLagrangian
description is used to represent the dispersed phase, for each individual particle or droplet an
equation of motion is solved:
dv (cid:88)
i
m = F (6.3)
i i
dt
(cid:80)
where m ,v represent, respectively, the mass and velocity of the ith particle and F the sum
i i i
of the forces acting on the ith particle. Forces due to gravity, drag, virtual mass and vorticity in
the continuous phase can be included in this term. The droplet position can be calculated using:
dx
i
= v (6.4)
i
dt
The advantages of this mixed Eulerian-Lagrangian approach are its greater generality and flexi-
bility with respect to the incorporation of microscopic transport phenomena: droplet dynamics
can be described in detail, a droplet diameter distribution can easily be incorporated, direct
droplet-droplet interactions can be accounted for as well as hydrodynamic interaction between
neighbouring droplets. Additionally, two-way coupling between the gas and the liquid phase can
be embedded in the model. The most important disadvantage of a mixed Eulerian-Lagrangian
approachisitsrelativelyhigh(comparedtocompletelyEulerianapproaches)computationalload.
In engineering research, the Eulerian-Lagrangian model is typically used to study hydrodynamic
phenomena that can only be described with great difficulty using a two fluid model (i.e. direct
38 PMBFS2 User’s Manual

## 페이지 48
Chapter 6. Multi-Phase Modeling
droplet-droplet interaction). In scientific research, the Eulerian-Lagrangian model is used more
broadly due to its physcial model insensitive than the Eulerian-Eulerian model. Additionally, a
Eulerian-Lagrangian model can, to a certain extent, assess the validity of the closure laws used
in the two fluid models.
Interface tracking or capturing models
In both the two-fluid model and the Eulerian- Lagrangian model, the resolution with which
the liquid velocity field is resolved is small compared to the size of the bubbles. However,
small-scale structures in the liquid (i.e. vortices shed from rising gas bubbles) govern various
phenomena encountered in droplet dynamics, such as bubble coalescence and changes in the
topology of the gas-liquid interface. To resolve the time-dependent motion of a gas bubble in a
liquid, a Volume Tracking method or a Marker Particle method such as the MAC (Welch et al.,
1965) method has to be used to account for possible bubble coalescence and topology changes
of the gas-liquid interface. These methods use the Navier- Stokes equations to resolve the gas-
phase and the liquid-phase velocity fields. The various Volume Tracking methods (Nichols et
al., 1980; Hirt and Nichols, 1981; Youngs, 1982 and Rudman, 1997) use a ’colour’ function F
to distinguish between the gas and the liquid phase, whereas Marker Particle methods such as
the MAC method, use marker particles to track the time-dependent motion of the liquid phase.
These Volume Tracking/Marker Particle methods can typically be used to provide in depth data
on bubble coalescence, bubble break up and the shapes and sizes of bubbles under the prevailing
flow conditions and physical properties of the liquid. These data can subsequently be used to
assess the validity of the closure models used in two fluid models or to assess the validity of
collision models and hydrodynamic interaction models in Eulerian Lagrangian type of models.
6.2 Eulerian-Lagrangian Models
The dispersed phase has been modeled using both Eulerian and Lagrangian approach in the
past. In the Eulerian approach, the dispersed phase is treated as a second continuum, and two
sets of equations, one for the gas phase and another for the liquid (pseudo-fluid) phase are solved
together to obtain the complete solution. Twofluid models of Crowe et al. [1997], Druzhinin and
Elgobashi. [1998] are based on this approach. On the other hand, in the Lagrangian model (also
referred to as Multi-continua formulation by Sirignano [1999]), Newton’s equation of motion for
the discrete parcels (moving droplet clouds) are solved explicitly to track an average particle in
theneighborhoodoftheEuleriangasfield(Sirignano[1999]). Inthisapproach,theLagrangianor
characteristic path is the the trajectory of an average droplet that represents a group of droplets
that (at least initially) is in the same neighborhood (Sirignano [1999]). Discrete-particle models
ofGosmanandIoannides[1983], Sirignano[1983, 1999], Faeth[1987]arebasedonthisapproach.
There are advantages and disadvantages to both approaches.
6.2.1 Model Assumptions
Solvingfortheparticleevolutioninspaceandtimewithinthegasfieldcanbecomputationally
expensive if a large number of particles have to be tracked. Therefore, a sampling technique is
employed, whereby characteristic groups of droplets are represented as "computational parcels".
Each of these computational parcels represents a group of particles, all having identical size,
location, velocity and temperature. For completeness, some of the assumptions used in the
PMBFS2 User’s Manual 39

## 페이지 49
6.2. Eulerian-Lagrangian Models
dispersed phase modeling are presented here, although more details can be found elsewhere
(Faeth [1987]).
• The spray field simulated here is assumed to be dilute. The dilute spray approximation
implies that while particles interact with the gas phase, direct interaction between drops
can be neglected. Dilute spray approximation also implies that the volume occupied by
the liquid phase is significantly smaller than the volume of the gas phase. Ratio of liquid
volume to gas volume is usually of the order of 0.001.
• The dilute spray approximation also precludes the droplet breakup effects and coalescence
processes (which might be significant in a dense spray situation). This implies that the
present model is not suitable for simulating the near field of the liquid atomizers/injectors
where the droplet collisions are high. However, the physical processes of interest, such as
droplet dispersion, evaporation, fuel-air mixing and combustion, that occur farther away
from the injector (where the dilute spray approximation is valid) can be simulated using
this model.
• Thedropletisassumedtobesphericalinthisformulation. Itisknownthatmovingdroplets
tend to deform; however, since the drag correlations (used in the present model) implicitly
incorporate this effect, and treat the droplets as equivalent spheres, this assumption is
reasonable.
• The pressure at the location of the droplet is assumed to be constant during its interaction
withthegasphaseandequaltothelocalambientpressure. Thisassumptionissatisfactory,
except at very low pressure.
• Only single component liquid fuels are considered in this study.
• Liquid phase mass diffusivities are assumed to be negligible. This is true because mass
diffusion in the liquid phase is very slow compared to with the heat diffusion in the liquid.
Moreover for a single component liquid (at a pressure lower than the critical pressure)
liquid-phase mass diffusivity can be neglected (Sirignano [1999]).
• The circulation velocity inside the droplet are assumed to be negligible.
Note that, within the Lagrangian formulation, many of these assumptions can be relaxed
using appropriate models. However, since these extensions require empirical correlations (that
may not apply to every flow), these effects are ignored at present.
6.2.2 Spray Dynamics
6.2.2.1 Equations of Motion for Droplet
The spray field dynamics will be modeled using a Lagrangian approach, which has been
proven to be an efficient way to describe inter-phase interactions. The motion of each individual
droplet can be determined by Newton’s second law as follows:
dx
d
= u (6.5)
d
dt
du
d
m = F (6.6)
d d
dt
40 PMBFS2 User’s Manual

## 페이지 50
Chapter 6. Multi-Phase Modeling
where x , u , m is the instantaneous droplet location, droplet velocity and mass, respectively.
d d d
The forces acting on each droplet include contributions from the virtual mass, drag, buoyancy,
Basset,gravity,andlift(Faeth,1983),andcanbecollectivelydescribedbytheBasset-Boussinesq-
Oseen (BBQ) equation.
For typical flowfields in a ramjet engine, the liquid-to-gas density ratio is about 103 and the
droplet size ranges from 20 µm to 300 µm in diameter. The contributions from virtual mass,
buoyancy, Basset forces, gravity, and lift can be omitted due to their small magnitudes. Only
drag force arising from skin friction and form drag is taken into account.
1
F = C ρπd2|u |u (6.7)
i,d 8 d d R R
where d and u are the diameter of the droplet and is the relative velocity between the
d R
droplet and the surrounding gas, respectively. The drag coefficient C is determined based on
d
Putnam’s work [2]:
(cid:40)
24 (1+ Re d 2/3 ) Re < 1000
C d = Red 6 d (6.8)
0.424 Re ≥ 1000
d
where the droplet Reynolds number is defined as
Re = ρ |u |d /µ (6.9)
d g R d g
6.2.2.2 Turbulent Dispersion of Droplet
This topic will be discussed in the next release version of PMBFS2 .
6.2.3 Spray Mass and Heat Transfer
The droplet mass transfer is governed by the droplet continuity equation:
dm
d
= −m˙ (6.10)
d
dt
where m is the mass of the droplet given by 4ρ πr3, and m˙ (> 0) is the net mass transfer rate
d 3 d d d
(or vaporization rate) for a droplet in a convective flow field, expressed (Faeth, 1983) as
m˙ 0.278Re 1/2 Sc1/3
d = 1+ (cid:104) d (cid:105) (6.11)
m˙ 1/2
d,Red=0 1+ 1.232
RedSc4/3
where Re is the Reynolds number for particle at rest. Under quiescent conditions, the mass
d=0
transfer rate reduces to
m˙ = 2πρ D d ln(1+B ) (6.12)
d,Red=0 s sm d M
where ρ and D are respectively the gas mixture density and the mixture diffusion coefficient
s sm
at the droplet surface. Also, B is the Spalding mass transfer number (Faeth, 1983) given by
M
Y −Y Y
F,s F,∞ F
B = b −b = ,where b = (6.13)
M ∞ s
1−Y Y −1
F,s F,s
In the above relations, Sc = υ /D (ratio of momentum to mass transport) is the Schmidt
g,s sm
number. Subscript s represents quantities at the droplet surface and ∞ indicates the far field.
PMBFS2 User’s Manual 41

## 페이지 51
6.2. Eulerian-Lagrangian Models
Also, Y is the fuel species (that is evaporating) mass fraction. Surface fuel mass fraction is
F
obtained from Raoult’s Law, which assumes that the mole fraction at the droplet surface is equal
to the ratio of the partial pressure of fuel vapor (p ) to the total pressure of the gas phase
vap
(p¯). Various correlations exist (Reid et al. 1988) to evaluate the partial pressure of fuel vapor.
Note that the gasphase variables (e.g., T˜ and Y˜ ) correspond to the far-field conditions for
F
the droplets and must be interpolated from the Eulerian numerical grid to the droplet location
during the simulations.
Droplet heat transfer is governed by the droplet energy equation, which consists of the exter-
nal and the internal energy, as well as the energy associated with surface tension. The equation
governing the internal temperature distribution based on this uniform temperature model is
dT
m C d = Q˙ −m˙ L = h πd2(T˜−T )−m˙ L (6.14)
d l dt conv d v d d p d v
h 0.278Re 1/2 Pr1/3
d = 1+ (cid:104) d (cid:105) (6.15)
h 1/2
Red=0 1+ 1.232
RedPr4/3
where Q˙ is the convective thermal energy transfer rate, C is liquid heat capacity, h is
conv l d
the heat transfer coefficient, and L is the latent heat of vaporization. Additional details of
v
this model, including the heat transfer coefficient and the latent heat of vaporization, are given
elsewhere (Faeth, 1983).
6.2.4 Spray Closure Models
6.2.4.1 Primary Atomization Models
The hydrodynamic stability analysis developed by Reitz [3] will be implemented to model
liquid injection and spray atomization. The disintegration of a liquid jet will be simulated by
injecting liquid in the form of "blobs", instead of an intact liquid jet at the nozzle exit. Each
blob has a characteristic size equal to the injector exit diameter, d , i.e.,
0
d = d (6.16)
int 0
The number of blobs injected per unit time is determined from the injector mass flow rate.
Each blob is assigned with an initial radial velocity component V = U tan(θ/2), where U is
0 0 0
the injection velocity and the spray angle, θ, is assumed to be uniformly distributed between 0
and Θ, with
tan(Θ/2) = A ΛΩ/U (6.17)
1 0
whereA hasavalueof0.188forasharpentrancenozzlewithalengthtodiameterratioof5. The
1
frequency of the wave with the maximum growth rate (i.e., the frequency of the fastest growing
Kelvin-Helmholtz wave) Ω, and the corresponding wave length, Lambda, could be determined
using a curve-fit solution of the linearized hydrodynamic equations as follows
(cid:161) (cid:162)(cid:161) (cid:162)
Λ 1+0.45Z0.5 1+0.4T0.7
= 9.02 (cid:161) (cid:162) (6.18)
a 1+0.87We1.67 0.6
g
(cid:181) (cid:182) (cid:161) (cid:162)
ρ a3 0.5 0.34+0.38We1.5
l g
Ω = (6.19)
σ (1+Z)(1+1.4T0.6)
42 PMBFS2 User’s Manual

## 페이지 52
Chapter 6. Multi-Phase Modeling
where Z = We0.5/Re is the Ohnesorge number, We = ρ U2a/σ the liquid Weber number,
l l l l R
We = ρ U2r /σ the gas Weber number, and T = ZWe0.5 the Taylor number. The variable
g g d 2
a is the blob/parent droplet radius. The subscripts l and g denote the liquid and gas phases,
respectively.
6.2.4.2 Secondary Atomization (Droplet Breakup) Models
The breakup of liquid droplet moving in a gaseous environment is assumed to be caused
by aerodynamic liquid-gas interactions, i.e., shear-flow-induced and drag-deceleration-induced
waves. The wave model is based on the Kelvin-Helmholtz type of waves on the surface of a
cylindrically symmetric liquid blob. The liquid (blob) breakup is modeled by postulating that
new drops are formed (with drop radius, r) from a parent drop with
r = B Λ (B Λ ≤ a) (6.20)
0 0
(cid:104) (cid:105)
(cid:161) (cid:177) (cid:162) (cid:161) (cid:177) (cid:162)
r = min 3πa2W 2Ω 0.33 , 3a2Λ 4 0.34 (B Λ > a, one time only) (6.21)
0
where B is a constant and equals 0.61.
0
InEq.(6.20),itisassumedthatdropletsareformedwithasizeproportionaltothewavelength
of the fastest growing or most unstable surface wave. In Eq. (6.21), drops larger than the jet
are allowed to produce once for each injected parcel to prevent drops from undergoing further
unrealistic size increase, and the larger droplet after breakup acts as a new parent drop. The
breakup of drops into new parent or smaller child drops is determined by tracking the change
in the radius of the parent droplet and collecting the mass that would have been shed due to
wave stripping and assigning this mass to the child drop. The rate of change of drop radius in a
parent parcel is assumed to obey the following equation
da (a−r)
= − (6.22)
dt τ
where τ = 3.726B a/ΛΩ, with B being a breakup time constant of 1.73 (Reitz, 1979).
1 1
6.2.4.3 Droplet Collision Models
This topic will be discussed in the next release version of PMBFS2 .
6.2.4.4 Droplet/Wall Interaction
This topic will be discussed in the next release version of PMBFS2 .
6.2.5 Coupling between Disperse and Carrier Phases
Coupling between the dispersed phase and the gas phase are provided by the interphase
exchange terms or the source terms that appear on the right-hand side of the LES equations.
These are computed as follows (Faeth, 1987, Oefelein, 1997):
   
 
ρ˙ dmd dmd
  F˙ s s   = −    dm d d t t du    = −    m d d d u t + dt udm dt d    (6.23)
 Q˙ s   dm d d t ed   m d d d e t d +e d dm dt d 
S˙ i,s dm d d t Yi m d dY d i t ,s +Y i,s dm dt d
PMBFS2 User’s Manual 43

## 페이지 53
6.2. Eulerian-Lagrangian Models
Here m ,u ,e are the mass, velocity, total energy of the fuel in the droplets, respectively.
d d d
Y is i-th species mass fraction of the fuel at the droplet surface.
i,s
Intheprecedingequations,thedropletmassism = ρ V ,thedropletvolumeisV = 4πr3/3,
d d d d d
the droplet internal energy is e = C T , where C is the liquid heat capacity, and the droplet
d l d l
evaporation rate is dm /dt = −m˙ . Further, simplifications can be made by realizing that only
d d
single component fuels are considered in this study. This implies that the mass fraction of fuel
species in the liquid droplet is always unity, that is, Y = 1 and dY /dt = 0.
i,s i,s
The final source terms for a single droplet can be summarized as (Faeth, 1987)
   
ρ˙ m˙
s d
 F˙   m˙ u − 4πρ r3dud 
 s  =  d d 3 d d dt  (6.24)
 Q˙ s   m˙ d h v,s −h d πd2 d (T −T d )−u d m d · d d u t d +m˙ d ( 2 1u d ·u d ) 
S˙ m˙
i,s d
The preceding relations are for a single droplet moving in a flowfield. To track groups
of particles (computational parcels), rather than individual particles, the interphase exchange
terms needs to be multiplied by the number of particles present per group for mass conservation.
This approach allows for a statistically significant number of particles to be tracked, also helps
to control the mass flow rate of the liquid.
Thus, if the number of particles n is present per group, then the volume-averaged source
d
terms for all of the droplet group trajectories that cross a computational cell are computed by
summing the contribution from every group as follows:
 (cid:80) 
n m˙
d d
 ˜˙ρ s     (cid:80) n (cid:104) m˙ m u − 4πρ r3dud (cid:105)   
 ˜˙F   d d d 3 d d dt 
  ˜˙ ˜ S ˙Q s s   =     (cid:80) m n d (cid:104) m˙ d h v,s −h d m πd2 d (T − (cid:80) T d )−u d m d · d d u t d +m˙ d (1 2 u d ·u d ) (cid:105)     (6.25)
i,s
n m˙
d d
m
where the summation index m is over all of the droplet groups crossing a computational cell
volume. Also, note that the species source term S
˜˙
for all species is zero, except for the species
i,s
that is present in liquid form and evaporating.
44 PMBFS2 User’s Manual

## 페이지 54
Chapter 7
Preconditioning Method
This method is especially valuable for solving aerodynamic flow fields involving multiple
scales (i.e., flow fields involving regions of very low speed in generally high-speed flow problems).
7.1 Introduction
Numerical algorithms for viscous compressible flow face well-known difficulties for low Mach
number conditions. If the total enthalpy is constant (isoenergetic flow), then steady solutions
approach the incompressible constant-density limit as Mach number approaches zero. Such
problems are often solved using the incompressible flow equations and artificial compressibility
formulations. Low-speed flows with heat transfer have variable density, and thus incompressible
formulations are not suitable. It has long been observed that the stability and/or convergence
properties of most compressible flow algorithms is degraded for low Mach number flows. A
number of preconditioning techniques have been developed to overcome these difficulties, and
recent review articles by Turkel [52, 53] give detailed accounts of many of these techniques.
Choi and Merkle [12] studied the convergence of implicit solutions for both one and two-
dimensional inviscid test problems. They introduced a preconditioning matrix diag(1,1,1,M−2)
into the compressible Euler equations written in (ρ,u,v,p) variables. These equations were then
transformed to conservative variables (ρ,ρu,ρv,e ) for solution. At M = 0.05, this method
t
gave convergence rates identical to those using the artificial compressibility equations. Merkle
and Choi [35] later concluded that the scheme of [12] was not adequate for inviscid flow below
M = 0.05 and developed a perturbation expansion approximation that gave convergence rates
independent of Mach number as low as 10−5, for a duct flow with substantial heat addition.
Choi and Merkle [13] concluded that the preconditioning of [12] was not effective for viscous
flows and proposed a new preconditioning for viscous variable Mach number flows, based on
(ρ,u,v,T) variables. These preconditioned equations are similar to the perturbation equations
of [35] but include a mechanism for controlling inviscid and viscous time-step parameters. The
preconditioningmatrixcontainsseparateinviscid (βM2)andviscous(δ)parameters, whereM is
a local Mach number modified with a limiter to avoid singular behavior near stagnation points.
This method was found to be effective at low Mach number for several test calculations ranging
from inviscid to highly viscous flows.
Weiss and Smith [57, 56] developed a preconditioning matrix related to that of [13], using
(ρ,u,v,T) variables on unstructured grids and without assuming an ideal gas. It is imple-
mented with a Roe-type flux-difference splitting and an explicit multistage algorithm, with dual
time stepping for unsteady flows. Pletcher and Chen [37] developed a preconditioned iterative
45

## 페이지 55
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
unsteady formulation, with pseudo-time derivative terms preconditioned by a constant matrix
diag(1/γM2,1,1,1) and using nondimensional (ρ,u,v,T) variables. Edwards and Liou [14] have
r
developedextensionsoftheadvectiveupwindsplittingmethod(AUSM)forallflowspeeds. They
employ the preconditioning matrix C of Choi and Merkle [13], as extended by Weiss and Smith
[57]. This scheme is successfully demonstrated for several two-dimensional viscous and inviscid
flows over a wide range of Mach numbers. Edwards and Thomas [15] utilize the Weiss-Smith
[57] preconditioning and a Roe-type scheme based on primitive variables (ρ,u,v,p).
In his recent review article, Turkel [53] gives two motivations for preconditioning: (1) precon-
ditioningoftimederivativestoaccelerateconvergenceand(2)modificationofupwindingschemes
or artificial dissipation for central differences to achieve accuracy at low Mach numbers. Accord-
ingly, the preconditioning matrix for time derivatives is treated separately from that included
with dissipation terms. The treatment given is very general and includes centered schemes with
scalar or matrix dissipation as well as upwind schemes. The closely related preconditionings of
Turkel [51], Choi andMerkle [13], and Weiss and Smith [57] are compared, and the selection of
preconditioning parameters and local limiters are discussed in detail.
The basic papers [12, 35, 13, 51]
7.2 A Unified Preconditioning Scheme for General Fluid Mix-
tures
It is well known that time-marching algorithms are efficient for solving the transonic, su-
personic, and hypersonic compressible flow problems. However, they encounter convergence
difficulties for the low-Mach number flows due to the pressure singularities in the momentum
equation and the system stiffness arising from the ill-conditioned eigenvalues.
To circumvent the pressure singularity problem, the static pressure p is decomposed into a
constant reference pressure, p , and a gauge pressure, p (Choi and Merkel, 1993[13]; Shuen et
0 g
al., 1993[44])
p = p +p (7.1)
0 g
To maximum the benefit of this method, p should be taken to comprise the majority of p.
0
Physically, the gauge pressure p amount to the dynamic pressure responsible for the velocity-
g
pressure coupling in the momentum equation, and is that part of pressure driving the flow
motions. With this decomposition, the static pressure, p, inside the momentum equation is
replaced by the gauge pressure, p .
g
To solve the system eigenvalue disparities and implement the dual-time stepping procedure,
pseudo-time derivatives are added to the governing equations yielding an equation of the form
as
∂q ∂Q ∂(E−E ) ∂(F−F ) ∂(G−G )
v v v
Γ + + + + = S (7.2)
∂τ ∂t ∂x ∂y ∂z
Here Γ represents the preconditioning matrix and τ the pseudo-time variable. By judicious
selectionoftheprimitivevariableqandthepreconditioningmethodology,convergenceinpseudo-
time can be optimized for a wide variety of conditions to any desired level of temporal accuracy.
Selection of the primitive variables and the preconditioning matrix is dependent upon two
criteria: 1) the eigenvalues must be well conditioned, real, and maintaining their directional
characteristics; and 2) diffusion processes must not be reversed. Based on these criteria, the
primitive variable vector is defined as
q = (p¯ ,u˜,v˜,w˜,T˜,Y˜ , ··· ,Y˜ ) (7.3)
g 1 N−1
46 PMBFS2 User’s Manual

## 페이지 56
Chapter 7. Preconditioning Method
The choice of pressure p as one of the primitive variables is crucial for two reasons. It singles
out the propagation of acoustic waves in the pseudo-time and facilitates the elimination of the
pressure singularity problem. The velocity components u(cid:101), v(cid:101), and w(cid:101) are also logical choices since
these quantities appear in the diffusion operators. Similarly, the temperature T(cid:101) and species
Y(cid:101) ,...,Y(cid:101) have been selected because they also appear in the diffusion operators. The choice
1 N−1
of temperature is primarily a matter of convenience. Using this term greatly simplifies the
computation of Jacobian matrices and eliminates the need to iteratively solve for temperature
as a function of enthalpy.
The preconditioning Jacobian matrices defined in the subsequent sections is derived based
on fundamental thermodynamic theories, which is valid over the entire fluid state of concern and
can accommodate any arbitrary equation of state. The key thermodynamic relations associated
with this approach are list in the next sub-section.
7.2.1 Important Thermodynamic Relationships
All the relationships required in the numerical algorithm, including Jacobian matrices and
fluidproperties, arederivedusingfundamentalthermodynamictheories, whichcanbecalculated
based on any equation of state. The partial mass and partial density properties of a real fluid
mixture are utilized in the derivations.
Pressure as function of density, temperature, and mass fraction.
First, a thermodynamic relationship correlating pressure as a function of temperature, den-
sity, and mass fractions is derived. According to thermodynamics, each intensive property will
depend on N +1 other intensive variables in a mixture. We begin with the following relation
p = p(T,ρ ) (7.4)
i
where i = 1,··· ,N. Only the differential form is interested, then it can be expressed as
(cid:181) (cid:182) (cid:181) (cid:182)
∂p
(cid:88)N
∂p
dp = dT + dρ (7.5)
i
∂T ∂ρ
ρi i=1 i T,ρj(cid:54)=i
Rearrange it, we have the following Eq.
(cid:34) (cid:35)
(cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182)
∂p
N(cid:88)−1
∂p ∂p ∂p
dp = dT + − dρ + dρ
i
∂T ∂ρ ∂ρ ∂ρ
ρi i=1 i T,ρj(cid:54)=i N T,ρj(cid:54)=N N T,ρj(cid:54)=N
Since ρ = ρY and
i i
dρ = Y dρ+ρdY (7.6)
i i i
Combining the above equations leads to following expression
N(cid:88)−1
dp = A dT +A dρ+ A dY (7.7)
T ρ Yi i
i=1
where
(cid:181) (cid:182)
∂p
A = (7.8)
T
∂T
ρi
PMBFS2 User’s Manual 47

## 페이지 57
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
(cid:34) (cid:35)
(cid:181) (cid:182) (cid:181) (cid:182)
∂p ∂p
A = ρ − (7.9)
Yi
∂ρ ∂ρ
i T,ρj(cid:54)=i N T,ρj(cid:54)=N
(cid:181) (cid:182) (cid:181) (cid:182)
(cid:88)N
∂p ∂p
A = Y = (7.10)
ρ i
∂ρ ∂ρ
i=1 i T,ρj(cid:54)=i T,Yi
A very useful formulation can be derived from Eq. 7.7, which is
(cid:183) (cid:184)
(cid:179) (cid:180) (cid:179) (cid:180) (cid:179) (cid:180)
N(cid:80)−1
dp− ∂p dT + ∂p − ∂p ρdY
dρ =
∂T
ρi i=1 (cid:179)
∂ρi
(cid:180) T,ρj(cid:54)=i
∂ρN
T,ρj(cid:54)=N
i
(7.11)
∂p
∂ρ
T,Yi
It has been shown in Meng and Yang (2003)[33] that the speed of sound for a general fluid
mixture can be expressed as
(cid:181) (cid:182) (cid:181) (cid:182)
∂p C ∂p
c2 = = p = γA (7.12)
ρ
∂ρ C ∂ρ
s,Yi v T,Yi
where C and C are constant-pressure and constant-volume specific heats, respectively, and γ
p v
is the ratio of specific heat.
Internal energy as function of temperature, pressure, and mass fraction.
Next, a thermodynamic relationship correlating internal energy as a function of pressure,
density, and mass fractions is derived. We begin with the following one
ρe = ρe(T,ρ ) (7.13)
i
where i = 1,··· ,N, and e is the specific internal energy. Its differential form can be written as
(cid:181) (cid:182) (cid:181) (cid:182)
∂e
(cid:88)N
∂ρe
dρe = ρ dT + dρ (7.14)
i
∂T ∂ρ
ρi i=1 i T,ρj(cid:54)=i
Based on the definition of partial density properties, it is recognized
(cid:181) (cid:182)
∂ρe
(cid:95)e =
i
∂ρ
i T,ρj(cid:54)=i
which is the partial density internal energy of species i in the mixture. The first derivative
in Eq. 7.14 is the constant volume heat capacity C . Substituting the partial density internal
v
energy of each species into Eq. 7.14 leads to the following expression
(cid:88)N
dρe = ρC dT + (cid:95)e dρ
v i i
i=1
and
(cid:88)N (cid:88)N
dρe = ρC dT + (cid:95)e ρdY + (cid:95)e Y dρ
v i i i i
i=1 i=1
48 PMBFS2 User’s Manual

## 페이지 58
Chapter 7. Preconditioning Method
Since dρe = ρde+edρ, the following expression is easily derived
N(cid:88)−1
1
(cid:88)N
de = C dT + ((cid:95)e −(cid:95)e )dY + ( Y(cid:95)e −e)dρ
v i N i i
ρ
i=1 i=1
Substituting Eq. 7.7 into above equation, we can establish
N(cid:88)−1
de = B dT +B dp+ B dY (7.15)
T p Yi i
i=1
where
(cid:195) (cid:33)
(cid:181) (cid:182) (cid:181) (cid:182)
1
(cid:88)N
∂ρ ∂p
B = C − Y (cid:95)e −e (7.16)
T v i i
ρ ∂p ∂T
i=1 T,Yi ρi
(cid:195) (cid:33)
(cid:181) (cid:182)
1
(cid:88)N
∂ρ
B = Y (cid:95)e −e (7.17)
p i i
ρ ∂p
i=1 T,Yi
(cid:40) (cid:34) (cid:35)(cid:41)
(cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182)
(cid:88)N
∂ρ ∂p ∂p
B = ((cid:95)e −(cid:95)e )−( Y (cid:95)e −e)· · − (7.18)
Yi i N i i
∂p ∂ρ ∂ρ
i=1 T,Yi i T,ρj(cid:54)=i N T,ρj(cid:54)=N
Enthalpy as function of temperature, pressure, and mass fraction.
The third relationship expresses enthalpy as a function of pressure, temperature, and mass
fractions. Based on fundamental thermodynamic theories, h = e+p/ρ, the following relation
can be obtained
1 p
dh = de+ dp− dρ (7.19)
ρ ρ2
Substituting Eq. 7.7 and 7.15 into above equation, the following expression is derived after some
straightforward manipulations
N(cid:88)−1
dh = D dT +D dp+ D dY (7.20)
T p Yi i
i=1
where (cid:195) (cid:33)
(cid:181) (cid:182) (cid:181) (cid:182)
1 ∂p ∂ρ
(cid:88)N
p
D = C − Y (cid:95)e −e− (7.21)
T v i i
ρ ∂T ∂p ρ
ρi T,Yi i=1
(cid:195) (cid:33)
(cid:181) (cid:182)
1 1 ∂ρ
(cid:88)N
p
D = + Y (cid:95)e −e− (7.22)
p i i
ρ ρ ∂p ρ
T,Yi i=1
(cid:195) (cid:33)(cid:34) (cid:35)
(cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182)
∂ρ
(cid:88)N
p ∂p ∂p
D = (cid:95)e −(cid:95)e − Y (cid:95)e −e− − (7.23)
Yi i N
∂p
i i
ρ ∂ρ ∂ρ
T,Yi i=1 i T,ρj(cid:54)=i N T,ρj(cid:54)=N
According to the definition in thermodynamics, we recognize that the coefficient D equals
T
to the constant pressure heat capacity C of a fluid mixture,
p
PMBFS2 User’s Manual 49

## 페이지 59
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
(cid:195) (cid:33)
(cid:181) (cid:182) (cid:181) (cid:182)
1 ∂p ∂ρ
(cid:88)N
p
C = D = C − Y (cid:95)e −e− (7.24)
p T v i i
ρ ∂T ∂p ρ
ρi T,Yi i=1
Relationship between constant-pressure and constant-volume specific heats.
The final relationship deals with constant-pressure and constant-volume specific heats. Ac-
cording to fundamental thermodynamics for a multi-component mixture,
s = s(T,ρ,Y ) i = 1,··· ,N −1
i
Its differential form can be written as
C ∂s
N(cid:88)−1
∂s
v
ds = dT +( ) dρ+ ( ) dY (7.25)
T ∂ρ
T,Yi
∂Y
T,ρ,Yj(cid:54)=i i
i
i=1
A similar relationship that defines entropy as a function of temperature, pressure, and mass
fraction can be easily derived as
C ∂s
N(cid:88)−1
∂s
p
ds = dT +( ) dp+ ( ) dY (7.26)
T ∂p
T,Yi
∂Y
T,p,Yj(cid:54)=i i
i
i=1
Combination of above two equations and rearrangement of the result lead to
C C ∂s ∂s
N(cid:88)−1
∂s ∂s
p v
( − )dT = ( ) dρ−( ) dp+ [( ) −( ) ]dY
T T ∂ρ
T,Yi
∂p
T,Yi
∂Y
T,ρ,Yj(cid:54)=i
∂Y
T,p,Yj(cid:54)=i i
i i
i=1
Substitution of Eq. (7.7) into above equation and elimination of dp give,
C C ∂s ∂p ∂s ∂s ∂p
p v
[ − +( ) ( ) ]dT = [( ) −( ) ( ) ]dρ
T T ∂p
T,Yi
∂T
T,Yi
∂ρ
T,Yi
∂p
T,Yi
∂ρ
T,Yi
N(cid:88)−1
∂s ∂s ∂s ∂p
+ [( ) −( ) −( ) ( ) ]dY
∂Y
T,ρ,Yj(cid:54)=i
∂Y
T,p,Yj(cid:54)=i
∂p
T,Yi
∂Y
T,Yj(cid:54)=i i
i i i
i=1
Since temperature, density, and mass fraction can vary independently, the coefficients of the
above differentials must vanish. Thus,
(cid:181) (cid:182) (cid:181) (cid:182)
∂s ∂p
C = C −T (7.27)
p v
∂p ∂T
T,Yi ρ,Yi
Application of the well-known Maxwell relation [Moran and Shapiro 1999],
∂p
(cid:181) (cid:182) (cid:181) (cid:182)
( )
∂s 1 ∂ρ 1
∂T
ρ,Yi
= = − (7.28)
∂p ρ2 ∂T ρ2 ∂p
T,Yi p,Yi (
∂ρ
)
T,Yi
gives,
(cid:181) (cid:182)
∂p 2
T ∂T
C = C + (cid:181) (cid:182) ρi (7.29)
p v ρ2 ∂p
∂ρ
T,Yi
50 PMBFS2 User’s Manual

## 페이지 60
Chapter 7. Preconditioning Method
This relationship will be employed to calculate the eigenvalues of the preconditioned governing
system.
Finally a relationship regarding the speed of sound in the mixture is derived. According to
the definition of the speed of sound
(cid:181) (cid:182)
∂p
c2 =
∂ρ
s,Yi
Based on the Eq. 7.7, the following expression is obtained in a straightforward manner.
(cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182) (cid:181) (cid:182)
∂p ∂p ∂T ∂p
= +
∂ρ ∂T ∂ρ ∂ρ
s,Yi ρi s,Yi T,Yi
In thermodynamics, the following relationship exists
s = s(T,ρ,Y )
i
Afterutilizingsomefundamentalthermodynamicrelationships,thefollowingdifferentialform
of above equation can be obtained
(cid:181) (cid:182) (cid:181) (cid:182)
C 1 ∂p
N(cid:88)−1
∂s
v
ds = dT − dρ+ dY
T ρ2 ∂T ∂Y i
ρi i=1 i T,ρ,Yj(cid:54)=i
Then the following expression is further derived
(cid:44)
(cid:181) (cid:182) (cid:181) (cid:182)
∂T T ∂p
= C
∂ρ ρ2 ∂T v
s,Yi ρi
An expression of the speed of sound in the general fluid mixture is established as
(cid:181) (cid:182) (cid:181) (cid:182)
∂p C ∂p
c2 = = p
∂ρ C ∂ρ
s,Yi v T,Yi
7.2.2 Preconditioning Matrix
With those fundamental thermodynamic relations, the transformation matrix T = ∂Q, A =
∂q
∂E, B = ∂F, C = ∂G can be defined. Each element of the first column of the matrix T has a
∂q ∂q (cid:179) (cid:180)∂q
common term ∂ρ , which can be expressed as
∂p
T,Yi
(cid:44)
(cid:181) (cid:182) (cid:181) (cid:182)
∂ρ C ∂p γ
p
= = (7.30)
∂p C ∂ρ c2
T,Yi v s,Yi
The preconditioning matrix is established after replacing the speed of sound in this term by
a scaling factor β.
PMBFS2 User’s Manual 51

## 페이지 61
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
0 γ 0 0 0 −AT − AY1 ··· − AYN−1 1
B β Aρ Aρ Aρ C
B B γu˜ ρ¯ 0 0 −ATu˜ − AY1 u˜ ··· − AYN−1 u˜ C C
B β Aρ Aρ Aρ C
B B γv˜ 0 ρ¯ 0 −ATv˜ − AY1 v˜ ··· − AYN−1 v˜ C C
Γ= B B B B B B B B B γ β h˜ t +( i P = N 1 Y˜ i (cid:95)ei γ − β β w˜ e− p ρ ) “ ∂ ∂ p ρ ” T,Yi ρ¯ 0 u˜ ρ¯ 0 v˜ ρ¯ ρ¯ w˜ ρ¯BT − − A A A T ρ ρ A w˜ A T ρ et ρ¯BY − 1 A − A A Y1 ρ ρ A w˜ Y A 1 ρ et · · · · · · ρ¯BYN − − A 1 Y − N A A − ρ ρ A 1 Y w N ˜ A − ρ 1 et C C C C C C C C C
B B B B γ β Y˜ 1 0 0 0 −A A T ρ Y˜ 1 ρ¯− AY A 1 ρ Y˜ 1 ··· − AYN A − ρ 1 Y˜ 1 C C C C
B B @ . . . . . . . . . . . . . . . . . . ... . . . C C A
γY˜ N−1 0 0 0 − ATY˜ N−1 − AY1 Y˜ N−1 ··· ρ¯− AYN−1 YN−1
β Aρ Aρ Aρ
(7.31)
where A ,A ,A ,B ,B are defined in the previous subsection. The scaling factor β takes
T ρ Yi T Yi
the form
γεc2
β = (7.32)
1+(γ −1)ε
or another easy defined form:
γ 1 γ −1
= + (7.33)
β εc2 c2
Here ε(0 < ε ≤ 1) is the preconditioning factor, which is proportional to the square of the
local Mach number, M2, and gives good control of both the convection and diffusion time scales.
In contrast to the form Γ defined by other researchers, all of the off-diagonal terms in Eq. 7.48
havebeenretained. Bykeepingtheseterms,theunalteredsystemisidenticallyrestoredasε → 1;
limΓ = T (7.34)
ε→1
The criteria employed to select optimal values for ε are present in the next subsection.
The system eigenvalues associated with the pseudo-time domain are obtained by taking the
determinant of the matrices Γ−1A,Γ−1B,Γ−1C. The calculation is straightforward, and the
eigenvalues are
λ = diag( λ λ u˜ u˜ u˜ ··· )
1 2
where λ and λ represent the rescaled acoustic eigenvalues. These terms are given by
1 2
(cid:112)
λ = 1[U(ε+1)+ U2(1−ε)2+4εc2]
1 2 (cid:112)
λ = 1[U(ε+1)− U2(1−ε)2+4εc2]
2 2
U represents u, v, and w in x-, y- and z-direction respectively. As ε → 1, the above equation
approaches the values given by the non-preconditioned system. Obviously, all of the eigenvalues
are in the same order of magnitude, which proves that the choice of preconditioning matrix Γ
and primitive variable vector is appropriate. Furthermore, since all the numerical Jacobians are
calculated based on the fundamental thermodynamics theories, those results are independent of
equation of state and can be apply to any fluid state of concern without empiricism.
52 PMBFS2 User’s Manual

## 페이지 62
Chapter 7. Preconditioning Method
7.2.2.1 Transformation Matrix for General Equation of State
Considering the variable (p ,u,v,w,T,k,ω,Y )T, where p = p+ 2ρk and h(cid:98) = h+ 1(u2 +
t i t 3 t 2
v2+w2)+ 5k.
3
The transformation matrix P without preconditioning is given as:
 
ρ(cid:99) 0 0 0 ρ(cid:99) ρ(cid:98) 0 ρ(cid:99)
pt T k Yj
 
 uρ(cid:99) ρ 0 0 uρ(cid:99) uρ(cid:98) 0 uρ(cid:99) 
 pt T k Yj 
 
 vρ(cid:99) 0 ρ 0 vρ(cid:99) vρ(cid:98) 0 vρ(cid:99) 
 pt T k Yj 
 
 wρ(cid:99) 0 0 ρ wρ(cid:99) wρ(cid:98) 0 wρ(cid:99) 
 pt T k Yj 
P =  
 h(cid:98)ρ(cid:99) −(1−ρh(cid:99)) ρu ρv ρw ρ(cid:99)h(cid:98) +ρh(cid:99) h(cid:98)ρ(cid:98) +ρh(cid:99)+ 5ρ 0 h(cid:98)ρ(cid:99) +ρh(cid:99) 


t pt pt T t T t k k 3 t Yj Yj 

 
kρ(cid:99) 0 0 0 kρ(cid:99) kρ(cid:98) +ρ 0 kρ(cid:99)


pt T k Yj 

 
ωρ(cid:99) 0 0 0 ωρ(cid:99) ωρ(cid:98) ρ ωρ(cid:99)
 pt T k Yj 
Y ρ(cid:99) 0 0 0 Y ρ(cid:99) Y ρ(cid:98) 0 Y ρ(cid:99) +ρδ
i pt i T i k i Yj ij
(7.35)
The preconditioning matrix Γ is given as:
 
ρ(cid:99)(cid:48) 0 0 0 ρ(cid:99) ρ(cid:98) 0 ρ(cid:99)

pt T k Yj

  uρ(cid:99)(cid:48) ρ 0 0 uρ(cid:99) uρ(cid:98) 0 uρ(cid:99)  
 pt T k Yj 
 
 vρ(cid:99)(cid:48) 0 ρ 0 vρ(cid:99) vρ(cid:98) 0 vρ(cid:99) 
 pt T k Yj 
 
 wρ(cid:99)(cid:48) 0 0 ρ wρ(cid:99) wρ(cid:98) 0 wρ(cid:99) 
Γ =


pt T k Yj 

   h(cid:98) t ρ(cid:99)(cid:48) pt −(1−ρh(cid:99) pt ) ρu ρv ρw ρ(cid:99) T h(cid:98) t +ρh(cid:99) T h(cid:98) t ρ(cid:98) k +ρh(cid:99) k + 5 3 ρ 0 h(cid:98) t ρ(cid:99) Yj +ρh(cid:99) Yj   
 
 kρ(cid:99)(cid:48) 0 0 0 kρ(cid:99) kρ(cid:98) +ρ 0 kρ(cid:99) 
 pt T k Yj 
 
 ωρ(cid:99)(cid:48) 0 0 0 ωρ(cid:99) ωρ(cid:98) ρ ωρ(cid:99) 
 pt T k Yj 
Y ρ(cid:99)(cid:48) 0 0 0 Y ρ(cid:99) Y ρ(cid:98) 0 Y ρ(cid:99) +ρδ
i pt i T i k i Yj ij
(7.36)
The inversion of the preconditioning matrix is
 
uρ(cid:99) vρ(cid:99) wρ(cid:99) ρ(cid:99)
T T T T
g − g 0 g
 11 d d d d 16 18 
 
 −u 1 0 0 0 0 0 0 
 ρ ρ 
 
  −v 0 1 0 0 0 0 0  
 ρ ρ 
 
 −w 0 0 1 0 0 0 0 
 ρ ρ 
Γ−1 =   (7.37)
 uρ(cid:99)(cid:48) vρ(cid:99)(cid:48) wρ(cid:99)(cid:48) ρ(cid:99)(cid:48) 

 g 51 −
pt
−
pt
−
pt pt
g 56 0 g 58


 d d d d 
 
 −k 0 0 0 0 1 0 0 
 ρ ρ 
 
 −ω 0 0 0 0 0 1 0 
 ρ ρ 
−Yi 0 0 0 0 0 0 1
ρ ρ
PMBFS2 User’s Manual 53

## 페이지 63
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
where
(cid:40) (cid:41)
(cid:183) (cid:184)
1 1 5
N(cid:88)−1
g = ρh(cid:99) +ρ(cid:99) (cid:98)h− (u2+v2+w2) +kρ(cid:98)h(cid:99) −kh(cid:99)ρ(cid:99) − kρ(cid:99) + Y (ρ(cid:99)h(cid:99) −ρ(cid:99)h(cid:99))
11
d
T T
2
k T k T
3
T i Yi T T Yi
i=1
1 5 1
g = (ρ(cid:99)h(cid:99)−ρ(cid:98)h(cid:99) + ρ(cid:99)), g = (ρ(cid:99)h(cid:99) −ρ(cid:99)h(cid:99))
16
d
T k k T
3
T 18
d
T Yi Yi T
(cid:189) (cid:183) (cid:184) (cid:183) (cid:184)
1 1 k 5
g = (1−ρh(cid:99))−ρ(cid:99)(cid:48) (cid:98)h− (u2+v2+w2) + ρρ(cid:99)(cid:48) h(cid:99)+ρ(cid:98)(1−ρh(cid:99))+ ρρ(cid:99)(cid:48)
51 d pt pt 2 ρ pt k k pt 3 pt
(cid:41)
N(cid:88)−1
Y
(cid:104) (cid:105)
+ i ρρ(cid:99)(cid:48) h(cid:99) +ρ(cid:99)(1−ρh(cid:99))
ρ pt Yi Yi pt
i=1
(cid:183) (cid:184)
(cid:104) (cid:105)
1 5 1
g = − ρρ(cid:99)(cid:48) h(cid:99)+(1−ρh(cid:99))ρ(cid:98) + ρρ(cid:99)(cid:48) , g = − ρρ(cid:99)(cid:48) h(cid:99) +(1−ρh(cid:99))ρ(cid:99)
56 ρd pt k pt k 3 pt 58 ρd pt Yi pt Yi
and h is the specific enthalpy per unit mass, d = ρρ(cid:99)(cid:48) h(cid:99) +ρ(cid:99)(1−ρh(cid:99)).
pt T T pt
The terms of the form ρ and ρ are derivatives of density with respect to temperature and
T p
pressure, respectively, and h and h are derivatives of specific enthalpy (per unit mass) with
T p
respect to temperature and pressure. These property derivatives are evaluated as functions of p,
T, and Y . The property derivatives designated with hat (e.g. h(cid:99) ) are functions of the following
i pt
“independent”variables: p ,T,q,andY . Arelationshipbetweenthehatandnon-hatvariables
t i
needs to be determined. This is accomplished as follows.
From the definition of p :
t
2 2
dp = dp+ kdρ+ ρdk
t
3 3
Nowdensity(ρ)andspecificenthalpyperunitmass(h)canbewritteninthefollowingfunctional
forms:
ρ = ρ(p,T,Y ), h = h(p,T,Y )
i i
Writing these as differentials:
dρ = ρ dp+ρ dT +ρ dY , dh = h dp+h dT +h dY
p T Yi i p T Yi i
and substituting the equation for dρ into the equation for dp , we get:
t
2 2 2 2
dp = [1+ kρ ]dp+ kρ dT + kρ dY + ρdk
t
3
p
3
T
3
Yi i
3
We will go through the analysis for ρ(cid:99) to show the procedure, and simply give the results
pt
for the remaining hat property derivatives.
(cid:189) (cid:190)
dρ dp dT dY
i
ρ(cid:99) = lim = ρ +ρ +ρ
pt
dpt→0,Yi,T,k=const dp t
p
dp t
T
dp t
Yidp
t
but here dT and dYi are both zero, so that
dpt dpt
(cid:175)
dp(cid:175)
ρ(cid:99) = ρ (cid:175)
pt p
dp
(cid:175)
t Yi,T,k
and is determined from the equation of dp to be:
t
(cid:175)
dp(cid:175) 1
(cid:175) =
dp (cid:175) 1+ 2kρ
t Yi,T,k 3 p
54 PMBFS2 User’s Manual

## 페이지 64
Chapter 7. Preconditioning Method
The resulting expression for ρ(cid:99) is given by:
pt
ρ
p
ρ(cid:99) = (7.38)
pt 1+ 2kρ
3 p
The remaining property derivatives (with hat) are evaluated in a similar manner and are
given by the following expressions:
ρ
T
ρ(cid:99) =
T 1+ 2kρ
3 p
−2ρρ
ρ(cid:98) = 3 p
k 1+ 2kρ
3 p
ρ
ρ(cid:99) =
Yi
Yi 1+ 2kρ
3 p
h
h(cid:99) = p (7.39)
pt 1+ 2kρ
3 p
2kρ h
h(cid:99) = h − 3 T p
T T 1+ 2kρ
3 p
−2ρh
h(cid:99) = 3 p
k 1+ 2kρ
3 p
2kρ h
h(cid:99) = h − 3 Yi p
Yi Yi 1+ 2kρ
3 p
Theparameterρ(cid:99)(cid:48) controlsthescalingbetweenrelevantphysicalprocessesinordertoenhance
pt
the rate of convergence for the numerical algorithm. It is chosen according to the criteria laid
out in the paper by Venkateswaran and Merkle (1995) for unsteady preconditioning. For the
case where no preconditioning is used this parameter reverts to its non-preconditioned form,
ρ(cid:99)(cid:48) = ρ(cid:99)
pt pt
The correct asymptotic form of this parameter is determined from low Mach number and low
Reynolds number scaling.
Without going into the details, a brief presentation of how to choose the preconditioning
parameter will be given. To begin with, the terms ρ(cid:99) and ρ(cid:99)(cid:48) are given by the following:
pt pt
1 ρ (1−ρh(cid:99))
ρ(cid:99) = −
T pt
(7.40)
pt
c
(cid:98)2 ρh(cid:99)
T
1 ρ (1−ρh(cid:99))
ρ(cid:99)(cid:48) = − T pt (7.41)
pt
V
(cid:99)2 ρh(cid:99)
r T
where c (cid:98)2 is equal to the speed-of-sound squared (c2) plus a contribution from the turbulent
kinetic energy (k). This term (c
(cid:98)2)
is defined according to:
ρh(cid:99)
c
(cid:98)2
(cid:44)
T
ρρ(cid:99)h(cid:99) +ρ (1−ρh(cid:99))
pt T T pt
ρh 2kρ(ρ h −ρ h )
(cid:44) T + 3 p T T p (7.42)
ρρ h +ρ (1−ρh ) ρρ h +ρ (1−ρh )
pt T T pt pt T T pt
PMBFS2 User’s Manual 55

## 페이지 65
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
For a perfect gas, the equation reduces to:
2
c
(cid:98)2
= γRT + γk
3
2 k
= γ(R+ )T
3T
= γR(cid:98)T (7.43)
The term V is a reference velocity that is chosen to appropriately precondition the relevant
r
time-scales. One possible way of choosing V is given by:
r
(cid:104) (cid:105)
(cid:161) (cid:162)
V2 = min c (cid:98)2,max V2 ,V2 ,V2 (7.44)
r inv vis unsteady
The inviscid velocity scale is given by V2 ∼ M2c2, where M is the Mach number. The
inv
viscous velocity scale is given by V2 ∼ V2 Re2 , where Re is a local cell Reynolds number.
vis inv ∆x ∆x
The unsteady velocity scale is given by V2 ∼ (l/∆tπ)2, where l is some characteristic
unsteady
length scale of the flow, and ∆T is the physical-time step size. To more appropriately evaluate
the preconditioning parameter, consult the references (Venkateswaran and Merkle 1995, Merkle
1995).
For unsteady simulation using dual-time stepping technique, the following combined matrix
is always be used (here we use a second order dual-time stepping),
3∆τ
S = Γ+ P (7.45)
2 ∆t
and
2 3
6
ρc(cid:48)
p
(cid:48)
t
0 0 0 ρcT ρck 0 ρdYj
7
6 7
6
6
uρc(cid:48)
p
(cid:48)
t
ρ 0 0 uρcT uρck 0 uρdYj 7
7
6 7
6 6
6
vρc(cid:48)
p
(cid:48)
t
0 ρ 0 vρcT vρck 0 vρdYj 7 7
7
6 7
S=(1+ 3∆τ ) 6 6 6 6 wρc(cid:48) p (cid:48) t 0 0 ρ wρcT wρck 0 wρdYj 7 7 7 7 (7.46)
2 ∆t 6 6 6 hb tρc(cid:48) p (cid:48) t −(1−ρhd pt ) ρu ρv ρw ρcThb t+ρhc T hb tρck+ρhc k+ 5 3 ρ 0 hb tρdYj +ρhd Yj 7 7 7
6 6
6
kρc(cid:48)
p
(cid:48)
t
0 0 0 kρcT kρck+ρ 0 kρdYj 7 7
7
6 7
6 6 4 ωρc(cid:48) p (cid:48) t 0 0 0 ωρcT ωρck ρ ωρdYj 7 7 5
Yiρc(cid:48)
p
(cid:48)
t
0 0 0 YiρcT Yiρck 0 YiρdYj +ρδij
where
ρ(cid:99)(cid:48) + 3∆τρ(cid:99)
ρ(cid:99)(cid:48)(cid:48) = pt 2 ∆t pt (7.47)
pt 1+ 3∆τ
2 ∆t
7.2.2.2 Transformation Matrix for Caloric and Thermally Perfect Gas
The detail formulation deduction is shown in the appendix of this manual.
 
γ 0 0 0 −ρ −ρΩ
β T j
   γ β u ρ 0 0 −ρ T u −ρuΩ j   
 γv 0 ρ 0 −ρv −ρvΩ 
Γ =  β T j  (7.48)
 γw 0 0 ρ −ρw −ρwΩ 
 β T j 
  γ β ht −1 ρu ρv ρw −ρ T ht +ρC p −ρh t Ω j +ρH j  
γYi 0 0 0 −ρYi ρδ −ρY Ω
β T ij i j
56 PMBFS2 User’s Manual

## 페이지 66
Chapter 7. Preconditioning Method
7.2.3 Convergence Optimization
Associatedwitheachfinite-volumecellarevariousfundamentaltimescaleswhichcharacterize
propagation rates of competing convective and diffusive processes in each of the coordinate
directions. The convective propagation rates are characterized by the Courant-Friedrichs-Lewy
(CFL) numbers
ρ(λ )∆τ ρ(λ )∆τ ρ(λ )∆τ
x y z
CFL = , CFL = , CFL = (7.49)
x y z
∆x ∆y ∆z
where ρ(λ ),ρ(λ ),ρ(λ ), are the spectral radii associated with
x y z
(cid:104) (cid:112) (cid:105)
ρ(λ ) = 1 |u|(1+ε)+ u2(1−ε)2+4εc2
x 2(cid:104) (cid:112) (cid:105)
ρ(λ ) = 1 |v|(1+ε)+ v2(1−ε)2+4εc2 (7.50)
y 2(cid:104) (cid:112) (cid:105)
ρ(λ ) = 1 |w|(1+ε)+ w2(1−ε)2+4εc2
z 2
The diffusive propagation rates are characterized by the von Neumann numbers
ν∆τ ν∆τ ν∆τ
VNN = , VNN = , VNN = (7.51)
x ∆x2 y ∆y2 z ∆z2
Buelow et al. (1994, 1995)[10, 9] have shown that the maximum CFL number associated
with a given cell scales with the grid aspect ratio, whereas the minimum CFL number remains
fixed. When source and sink terms are not present, optimum pseudo-time step corresponds to
the minimum CFL number. This criteria is enforced in a three-dimensional domain by selecting
CFL∆x CFL∆y CFL∆z
∆τ = max( , , ) (7.52)
ρ(λ ) ρ(λ ) ρ(λ )
x y z
The time step definition given by this equation incorporates the preconditioning factor as a
function of the spectral radii given above.
The optimal value of the preconditioning factor is dependent upon the local Mach number
and the cell Reynolds numbers
u˜∆x v˜∆y w˜∆z
Re = ,Re = ,Re = (7.53)
x y z
ν ν ν
the cell Prandtal number Pr, the cell Schmidt number Sc = ν/D (i = 1,...,N), and the physi-
i im
caltimestepemployedinthecalculationprocedure. IftherespectivequantitiesRe,RePr,ReSc
exceed a value of unity in either of the coordinate direction, convective effects dominant and the
conservation equations exhibit a hyperbolic character. For this situation an inviscid criterion
must be employed. If Re,RePr,ReSc are less than or equal to unity, diffusive effects dominate,
a parabolic character is exhibited and a viscous criteria must be employed.
An additional criterion that must be considered when employing the dual-time stepping
methodology is the effect of the physical time derivatives on the pseudo-time system. The first
term in Eq. 7.2 behaves as a sink in the pseudo-time system with a magnitude that is directly
proportional to the pseudo-time step and inversely proportional to the physical time step. It is
wellknownthatsuchtermspromotefavorabledampingcharacteristicsintime-marchingschemes
and accelerate convergence. Venkateswaran and Merkel (1995)[54] have shown that a limit exists
where preconditioning the pseudo-time derivatives negates the favorable damping characteristics
induced by these sink terms.
PMBFS2 User’s Manual 57

## 페이지 67
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
In the current work, the preconditioning factor is selected using the methodologies developed
byChoiandMerkel(1993)[13],Buelowetal.(1995)[9],andVenkateswaranandMerkel(1995)[54].
Optimal values are specified locally by the relation
ε = min[1,max(ε ,ε ,ε )] (7.54)
inv ∆t vis
The subscripts "inv", "∆t", and "vis" refer to the inviscid, unsteady, and viscous precondi-
tioning factors, respectively. The criteria employed to evaluate these terms are given below.
7.2.3.1 Inviscid Preconditioning Factor
Choi and Merkel (1993)[13] have demonstrated that an effective convective criterion which
insuresthatacousticsspeedsandflowvelocitiesarethesameorderofmagnitudeisobtainedwhen
ε is assigned a value proportional to the local Mach number. To obtain the correct functional
form, itisnecessarytoexaminethecharacteristicconditionnumber, whichisdefinedastheratio
of the largest to smallest absolute eigenvalue. The optimum condition number is unity.
In the limit as M2 → 0, a minimum condition number of 2 is obtained, with local minima
corresponding to the relation ε = 2M2. To achieve the correct limiting behavior at low Mach
numbers, the inviscid criteria for the preconditioning factor is specified as

 ε2 M ≤ ε
ε = 2M2 ε < M < 1 (7.55)
inv

1 M ≥ 1
The term ε is included to avoid singularities in stagnation regions where M = 0. Typically,
ε = 10−5. For infinitely large physical CFL numbers (the steady state limit) and in the absence
ofstronglocaldiffusionprocesses, thischoiceyieldsminimaldisparitiesinthesystemeigenvalues
and optimal damping rates. The convergence rates are entirely dependent on the magnitude of
the pseudo CFL number.
7.2.3.2 Unsteady Preconditioning Factor
Venkateswaran and Merkel (1995)[54] have employed von Neumann stability theory to gain
insightintothecharacteristicsofthedual-timesystemandtheeffectsofthephysicalCFLnumber
on the numerical attributes of the pseudo-time system. Results demonstrate the effects of small
physical time steps on the system eigenvalues. In contrast to the steady state limit described
above, the limit of infinitely small physical CFL numbers alters the system eigenvalues such
that the choice ε = 1 renders minimal disparities. This effect is caused by the physical time
derivatives that appear as sink terms in the pseudo-time equations.
The trends presented by them indicated that the optimal choice for the unsteady precondi-
tioning factor is bounded by the interval ε ≤ ε ≤ 1 and inversely related to the value of the
inv ∆t
local physical CFL number. By examining the eigenvalues and making a series of simplifying
assumptions, a factor of the form
1 l l l
ε = [( x )2+( y )2+( z )2]+M2 (7.56)
∆t c2 π∆t π∆t π∆t
was derived. Here, l ,l and l represent the characteristic dimensions of the computational
x y z
domain and M is the Mach number. This equation is tuned to damp the low wavenumber modes
which are typically the most difficult to treat.
58 PMBFS2 User’s Manual

## 페이지 68
Chapter 7. Preconditioning Method
7.2.3.3 Viscous Preconditioning Factor
In regions where diffusion processes dominate, the criteria outlined in the last two sections
must be modified to account for interactions associated with the parabolic system. Buelow et
al. (1994, 1995)[10, 9] have conducted a variety of studies to determine an optimal viscous
preconditioning factor for the Navier-Stokes equations. Results from stability analysis indicate
that three different requirements must be addressed in order to specify a generalized criterion.
For high cell Reynolds numbers (Re (cid:192) 1) the acoustic wave speeds should be scaled to the same
order of magnitude as the particle speeds, as is accomplished by the inviscid preconditioning
factor defined above. For low cell Reynolds numbers (Re (cid:191) 1) and high acoustic cell Reynolds
numbers (Re/M (cid:192) 1) the diffusion rates should be scaled to the same order of magnitude as
the acoustic speeds. For low cell Reynolds numbers and low acoustic cell Reynolds numbers the
diffusion rates should be scaled to the particle speeds. The only way to satisfy these conditions
simultaneously is to define a viscous preconditioning factor that is dependent on the Fourier
wavenumber. Such a definition is not appropriate for implementation in a CFD code.
To overcome the difficulties outlined above, Buelow et al. (1994, 1995)[10, 9] have developed
a preconditioning factor based on local length scales which is tuned to damp the low wavenum-
ber modes. This definition requires a priori assumption regarding the orientation of dominate
convective and diffusion processes within a given grid configuration and the choice for ε is
vis
somewhat more involved. In three dimensions, there are three possible CFL numbers, and two
possible VNN numbers, and six possible values of ε exist. The most restrictive of the CFL
vis
and VNN numbers are usually chosen for stability reasons and these values are the most likely
candidates for determining ε . Some freedom does exist, however, in how ε is evaluated.
vis vis
Most grid configurations are stretched such that predominate diffusion processes are resolved
in a direction normal to the predominate convective processes. Under these conditions, the rate
limitingdiffusionprocessestypicallycoincidewiththemaximumvonNeumannnumberinagiven
cell. To retain the benefits of the time step definition given by Eq. 7.52, this quantity must be
optimized with respect to the minimum CFL number. In three-dimensional this achieved by:
1) equating Eq. 7.49 with Eq. 7.51, respectively; 2) solving for respective values of ε; and 3)
choosing the largest of the three values obtained. Performing this operation yields an expression
of the form
(cid:34) (cid:35)
u˜2δ (δ −1) v˜2δ (δ −1) w˜2δ (δ −1)
x x y y z z
ε = max , , (7.57)
vis u˜2δ2+c2 v˜2δ2+c2 w˜2δ2+c2
x y z
where
ν ν 1 CFL
δ = max(ν, , )
x
Pr Sc u˜VNN
i
ν ν 1 CFL
δ = max(ν, , )
y
Pr Sc v˜VNN
i
ν ν 1 CFL
δ = max(ν, , )
z
Pr Sc w˜VNN
i
This equation takes into account the effects of momentum, energy, and mass diffusion pro-
cesses on the overall convergence rate.
PMBFS2 User’s Manual 59

## 페이지 69
7.2. A Unified Preconditioning Scheme for General Fluid Mixtures
60 PMBFS2 User’s Manual

## 페이지 70
Chapter 8
Spatial Discretization
8.1 Finite Volume Approximations
The finite-volume approach allows for the treatment of arbitrary geometry. To utilize this
approach, thegoverningequationsareintegratedoveracontrolvolumeV enclosedbythesurface
S in the physical domain as:
(cid:90)(cid:90)(cid:90) (cid:181) (cid:182)
∂Q ∂(E−E ) ∂(F−F ) ∂(G−G )
v v v
+ + + −H dV = 0 (8.1)
∂t ∂x ∂y ∂z
V
Using the Gauss divergence theorem, the integral conservation equation takes the following form
for the three dimensional cell with six surfaces, as shown in Fig. 8.1,
y
x 6
z S.
i+1/2,j+1/2,k
5
i+1/2,j,k-1/2
7
8 i+1/2,j,k S- i+1,j,k
i,j,k 2
i+1/2,j,k+1/2
1 S/ i+1/2,j-1/2,k
3
4
Figure 8.1: Schematic of three-dimensional finite volume adjacent cells.
(cid:90)(cid:90)(cid:90) (cid:90) (cid:90) (cid:90) (cid:90)(cid:90)(cid:90)
∂Q (cid:42) (cid:42) (cid:42)
dV + W •(cid:126)n dS + W •(cid:126)n dS + W •(cid:126)n dS = HdV (8.2)
ξ ξ η η ζ ζ
∂t
V Sξ ! ! Sη ! ! Sζ V
where
W(cid:126) = (E−E )(cid:126)i+(F−F )(cid:126)j +(G−G )(cid:126)k
ν ν ν
61

## 페이지 71
8.1. Finite Volume Approximations
and (cid:126)n ,(cid:126)n ,(cid:126)n are unit vectors normal to the surface in the ξ,η,ζ directions, respectively. The
ξ η ζ
unit normal vectors are related to the cell surface areas S ,S ,S as:
ξ η ζ
(cid:181) (cid:182) (cid:175) (cid:175)
(cid:126)n = S (cid:42) i +S (cid:42) j +S (cid:126)k / (cid:175) (cid:175)S(cid:126) (cid:175) (cid:175)
ξ ξ x ξ y ξ z ξ
(cid:181) (cid:182) (cid:175) (cid:175)
(cid:126)n = S (cid:42) i +S (cid:42) j +S (cid:126)k / (cid:175) (cid:175)S(cid:126) (cid:175) (cid:175) (8.3)
η η x η y η z η
(cid:181) (cid:182) (cid:175) (cid:175)
(cid:126)n = S (cid:42) i +S (cid:42) j +S (cid:126)k / (cid:175) (cid:175)S(cid:126) (cid:175) (cid:175)
ζ ζ x ζ y ζ z ζ
The cell surface areas are defined as:
(cid:175) (cid:175)
(cid:175) (cid:126)i (cid:126)j (cid:126)k (cid:175)
S(cid:126) = 1 ((cid:126)r ×(cid:126)r ) = 1 (cid:175) (cid:175) x −x y −y z −z (cid:175) (cid:175) = S (cid:126)i+S (cid:126)j +S (cid:42) k
ξ 2 72 36 2 (cid:175) (cid:175) 2 7 2 7 2 7 (cid:175) (cid:175) ξx ξy ξz
x −x y −y z −z
6 3 6 3 6 3
(cid:175) (cid:175)
(cid:175) (cid:126)i (cid:126)j (cid:126)k (cid:175)
S(cid:126) = 1 ((cid:126)r ×(cid:126)r ) = 1 (cid:175) (cid:175) x −x y −y z −z (cid:175) (cid:175) = S (cid:126)i+S (cid:126)j +S (cid:42) k (8.4)
η 2 86 75 2 (cid:175) (cid:175) 6 8 6 8 6 8 (cid:175) (cid:175) ηx ηy ηz
x −x y −y z −z
5 7 5 7 5 7
(cid:175) (cid:175)
(cid:175) (cid:126)i (cid:126)j (cid:126)k (cid:175)
S(cid:126) = 1 ((cid:126)r ×(cid:126)r ) = 1 (cid:175) (cid:175) x −x y −y z −z (cid:175) (cid:175) = S (cid:126)i+S (cid:126)j +S (cid:42) k
ζ 2 74 83 2 (cid:175) (cid:175) 4 7 4 7 4 7 (cid:175) (cid:175) ζx ζy ζz
x −x y −y z −z
3 8 3 8 3 8
The magnitude of each surface vector can be obtained by
(cid:175) (cid:175)
(cid:175) (cid:175)S(cid:126) (cid:175) (cid:175) = (cid:161) S2 +S2 +S2 (cid:162) 1/2
ξ ξ x ξ y ξ z
(cid:175) (cid:175)
(cid:175) (cid:175)S(cid:126) (cid:175) (cid:175) = (cid:161) S2 +S2 +S2 (cid:162) 1/2
η η x η y η z
(cid:175) (cid:175)
(cid:175) (cid:175)S(cid:126) (cid:175) (cid:175) = (cid:161) S2 +S2 +S2 (cid:162) 1/2
ζ ζ x ζ y ζ z
The cell volume ∆V associated with each cell can be evaluated using Kordulla and Vinokur’s
formula (1983):
(cid:179) (cid:180)
1
∆V = (cid:126)r · S(cid:126) +S(cid:126) +S(cid:126)
17 ξ η ζ
2
We also define cell surface areas per cell volume as:
(cid:126)˜S = S(cid:126) /∆V,(cid:126)˜S = S(cid:126) /∆V,(cid:126)˜S = S(cid:126) /∆V
ξ ξ η η ζ ζ
Assuming the increments ∆ξ = ∆η = ∆ζ = 1 in the body-fitted coordinate system, the
following governing equation in the general coordinates can be obtained:
∆Q
i+1/2,j,k i,j+1/2,k i,j,k+1/2
+ (E −E )| + (F −F )| + (G −G )| = H (8.5)
∆t ξ ξv i−1/2,j,k η ηv i,j−1/2,k ζ ζv i,j,k−1/2
where the vectors are defined as:
∆Q = Qn+1−Qn
(cid:179) (cid:180) (cid:179) (cid:180)
E = S˜ E+S˜ F+S˜ G , E = S˜ E +S˜ F +S˜ G
ξ ξ x ξ y ξ z ξν ξx ν ξ y ν ξ z ν
(cid:179) (cid:180) (cid:179) (cid:180)
F = S˜ E+S˜ F+S˜ G , F = S˜ E +S˜ F +S˜ G
η η x η y η z ην ηx ν η y ν η z ν
(cid:179) (cid:180) (cid:179) (cid:180)
G = S˜ E+S˜ F+S˜ G , G = S˜ E +S˜ F +S˜ G
ζ ζ x ζ y ζ z ζν ζx ν ζ y ν ζ z ν
62 PMBFS2 User’s Manual

## 페이지 72
Chapter 8. Spatial Discretization
The quantities E , E ,F ,F ,G and G
ξ,i±1/2,j,k ξν,i±1/2,j,k η,i,j±1/2,k ην,i,j±1/2,j,k ζ,i,j,k±1/2 ζν,i,j,k±1/2
represent the numerical fluxes associated with each cell interface (see Fig.8.1 ). S˜ represents
the cell surface areas per cell volume. The above analysis describes the transformation of a
quadrilateral cell with a volume ∆V in the x-y-z coordinates to a cubic cell with unit volume in
the general coordinate (i.e., ξ −η−ζ coordinates). The maximum time increment ∆t for each
cell can be evaluated by:
∆t ∆t ∆t
ξ η ζ
∆t = (8.6)
∆t ∆t +∆t ∆t +∆t ∆t
ξ η η ζ ζ ξ
where
CFL·∆V
∆t = (cid:175) (cid:175)
ξ (cid:175) (cid:175)
|u˜S +v˜S +w˜S |+c(cid:175)S(cid:126) (cid:175)
ξx ξy ξz ξ
CFL·∆V
∆t = (cid:175) (cid:175)
η (cid:175) (cid:175) (8.7)
|u˜S +v˜S +w˜S |+c(cid:175)S(cid:126) (cid:175)
ηx ηy ηz η
CFL·∆V
∆t = (cid:175) (cid:175)
ζ (cid:175) (cid:175)
|u˜S +v˜S +w˜S |+c(cid:175)S(cid:126) (cid:175)
ζx ζy ζz ζ
√
and c = γRT is the local speed of sound.
8.2 Central Scheme
Different approaches used for evaluating the numerical fluxes lead to different schemes with
disparate numerical characteristics. For a central difference scheme, the convective flux at any
cell face in the ξ-direction can be written as:
1 (cid:163) (cid:164)
Eˆ = E (QL)+E (QR) (8.8)
ξ,i+1/2,j 2 ξ ξ
where the left and right stencils are used to give desired accuracy. The above equation corre-
sponds to the stencil illustrated in Fig.2. The superscripts L and R represent the left and right
cells. Depending on the manner in which these terms are evaluated, a wide variety of central
and upwind schemes can be obtained. In the present work, the methodology proposed by Rai
and Chakravarthy (1993)[40] is used. Accordingly the numerical flux is calculated as:
Figure 8.2: Schematic diagram of the stencil used for evaluating inviscid fluxes in the x-y plane.
(cid:195) (cid:33)
Eˆ −2Eˆ +Eˆ
ˆˆE = Eˆ −φ (4) ξ,i+3/2,j,k ξ,i+1/2,j,k ξ,i+1/2,j,k (8.9)
ξ,i+1/2,j,k ξ,i+1/2,j,k i+1/2,j,k 24
PMBFS2 User’s Manual 63

## 페이지 73
8.2. Central Scheme
where φ(4) is the flux limiter. This term switches the truncation error associated with the flux-
difference from fourth-order accuracy when φ(4) = 1 to second-order accuracy when φ(4) = 0.
To evaluate to the desired accuracy in Eq. 8.8, the left and right state terms in Eq. 8.9 must
be computed using the same or higher order accuracy. These terms are written as follows to
facilitate easy switching and make the scheme with total variation diminishing (TVD) property.
(cid:181) (cid:182)
3∇Q +∇Q
QL = Q +φ (2) i+1,j,k i,j,k
i+1/2,j,k i,j,k i+1/,j,k 8
(cid:181) (cid:182)
−5∇Q +7∇Q +∇Q −3∇Q
(4) i+2,j,k i+1,j,k i,j,k i−1,j,k
+φ
i+1/2,j,k 128
(cid:181) (cid:182)
∇Q +3∇Q
QR = Q −φ (2) i+2,j,k i+1,j,k
i+1/2,j,k i,j,k i+1/,j,k 8
(cid:181) (cid:182)
3∇Q −∇Q −7∇Q +5∇Q
(4) i+3,j,k i+2,j,k i+1,j,k i,j,k
+φ
i+1/2,j,k 128
∇Q = Q −Q
i,j i,j i−1,j
These stencils can be used to get fifth-order accuracy (φ(4) = 1,φ(2) = 1), third-order accuracy
(φ(4) = 0,φ(2) = 1), and first-order accuracy (φ(4) = 0,φ(2) = 0), respectively. The present
work utilizes second-order overall accuracy for the spatial discretization except in regions close
to physical boundaries. The third-order accurate evaluation of the left and right states is thus
employed. The fluxes in the η- and ζ-directions can be computed following a similar procedure
as described above.
8.2.1 Artificial dissipation
Artificial dissipation plays a crucial role in maintaining numerical stability for central dif-
ferencing schemes. The specific form of artificial dissipation depends on the order of accuracy
of the numerical scheme, and must be higher-order accurate to minimize its negative effect
on numerical accuracy. In the present case, the numerical discretization of the flux vectors is
second-order accurate in the interior region of the computational domain. Accordingly, the arti-
ficial dissipation is fourth-order accurate. The numerical accuracy decreases to first-order near
the physical boundary because a higher-order approximation of derivatives at interior nodes may
require information at points outside the boundary. The artificial dissipation terms thus become
second-order accurate. The numerical dissipation used in the present scheme is a blending of
second- and fourth-order dissipation. The second-order terms are used near shock waves and
in flame zones to prevent spurious oscillations in such regions, while the fourth-order terms are
important for stability and convergence in smooth regions. The standard dissipation model can
be written as:
AD = artificial dissipation = d −d (8.10)
i+1/2,j,k i−1/2,j,k
where
(cid:175) (cid:175) (cid:175)
ε 1 ∂Q(cid:175) ε 1 ∂3Q(cid:175) ε 1 ∂5Q(cid:175)
d = 2 (cid:175) − 4 (cid:175) + 6 (cid:175) (8.11)
i±1/2,j,k 8 ∆t ∂ξ (cid:175) 8 ∆t ∂ξ3 (cid:175) 8 ∆t ∂ξ5 (cid:175)
i±1/2,j,k i±1/2,j,k i±1/2,j,k
where ε ,ε ,ε correspond to the coefficients of the second-, fourth- and sixth-order accurate
2 4 6
artificial dissipation terms and in the present formulation, ∆ξ = 1.
Even though the standard dissipation model has proven to be reasonably effective in many
cases, there are strong motivations for reducing the numerical dissipation. Also the standard
64 PMBFS2 User’s Manual

## 페이지 74
Chapter 8. Spatial Discretization
model may encounter difficulties in high-speed and reactive flows with discontinuities near flame
fronts and shock waves as in the present case. A matrix dissipation model was constructed
by Swanson and Turkel (1992)[49] and Jorgenson and Turkel (1993)[27] to overcome the above
difficulties. In their models,
(cid:175) (cid:175)
(cid:175) (cid:175) (cid:175) (cid:175)
d = ε (2) (cid:175) (cid:175)Aˆ (cid:175) (cid:175)
∂Q(cid:175)
(cid:175) −ε (4) (cid:175) (cid:175)Aˆ (cid:175) (cid:175)
∂3Q(cid:175)
(cid:175) (8.12)
i+1/2,j,k i+1/2,j,k i+1/2,j,k ∂ξ (cid:175) i+1/2,j,k i+1/2,j,k ∂ξ3 (cid:175)
i+1/2,j,k i+1/2,j,k
with (cid:175) (cid:175) (cid:175) (cid:175)
(cid:175) (cid:175) (cid:175) (cid:175)
(cid:175)Aˆ (cid:175) = M (cid:175)Λˆ (cid:175)M−1
ξ ξ ξ
ε (2) = κ(2)max(ν ,ν ,ν ,ν )
i+1/2,j,k i−1,j,k i,j,k i+1,j,k i+2,j,k
|p −2p +p |
i−1,j,k i,j,k i+1,j,k
ν =
i,j,k
|p −p |+|p −p |+ε|p +2p +p |
i+1,j,k i,j,k i,j,k i−1,j,k i−1,j,k i,j,k i+1,j,k
(cid:179) (cid:180)
ε (4) = max 0,(κ(4)−ε (2) )
i+1/2,j,k i+1/2,j,k
1 1 1 1
κ(2) = ∼ ,κ(4) = ∼ , ε = 0.05 ∼ 0.5
4 2 64 32
The matrix dissipation implemented in the present study renders the numerical scheme TVD,
as proved by Jorgenson and Turkel (1993), to prevent the occurrence of spurious oscillations in
regions containing steep gradients. It has also been shown by Jorgenson and Turkel (1993)[64]
thatmatrixdissipationassociatedwithacentral-differenceschemecanindeedimprovetheshock-
capturing capability.
The terms M and M−1 are the right and left eigenvectors matrices, which diagonalize A,
ξ ξ
where A = ∂E /∂Q. The eigenvalues of the flux Jacobin matrix A are:
ξ
λ = λ = λ = λ = U,λ = U ±C
1 2 3 6 4,5
(cid:175) (cid:175)
where U = S˜ u+S˜ v+S˜ w and C = c (cid:175) (cid:175)S (cid:126)˜ (cid:175) (cid:175) . The term Λˆ represents the modified diagonal
ξx ξy ξz ξ ξ
matrix of eigenvalues Λˆ = diag(λ˜ ,λ˜ ,λ˜ ,λ˜ ,λ˜ ,λ˜ ) to avoid zero eigenvalues, and the modified
ξ 1 2 3 4 5 6
eigenvalues are:
λ˜ = λ˜ = λ˜ = λ˜ = max(|λ |,V σ),λ˜ = max(|λ |,V σ)
1 2 3 6 1 l 4,5 4,5 n
where σ is the spectral radius of the flux Jacobian matrix A. V = 0.025 and V = 0.25 were
(cid:175) (cid:175) l (cid:175) (cid:175) n
(cid:175) (cid:175) (cid:175) (cid:175)
used (Zingg et al, 2000) in the present study. In evaluating (cid:175)Aˆ (cid:175) = M (cid:175)Λˆ (cid:175)M−1, the Roe average
ξ ξ ξ
was used because of the existence of large density gradients. The overall strategy has been
benchmarked against several model validation problems, including the supersonic flow over a
wedge and the acoustic response of a normal shock wave to externally impressed disturbances.
The scalar dissipation model developed by Jameson, Schmidt and Turkel (1981)[26] is a
simpler version of the matrix dissipation model. In such a scalar dissipation model, the modified
eigenvalues become
λ˜ = λ˜ = λ˜ = λ˜ = λ˜ = λ˜ = σ
1 2 3 4 5 6
Then dissipation can be written as
(cid:175) (cid:175)
∂Q(cid:175) ∂3Q(cid:175)
d = ε (2) σ (cid:175) −ε (4) σ (cid:175)
i+1/2,j,k i+1/2,j,k i+1/2,j,k ∂ξ (cid:175) i+1/2,j,k i+1/2,j,k ∂ξ3 (cid:175)
i+1/2,j,k i+1/2,j,k
PMBFS2 User’s Manual 65

## 페이지 75
8.2. Central Scheme
The matrix dissipation model is more generalized and accurate, although the computation of
these matrices at every grid-cell requires more computational time and memory.
The second-order dissipation term is nonlinear. Its purpose is to introduce an entropy-like
condition and to suppress oscillations in the neighborhood of shock discontinuities. This term is
small in the smooth portion of the flow field. The switch ν is important near discontinuities,
i,j,k
as there are large pressure gradients across them. To resolve flames, however, this switch is
changedto include temperature- or density-gradients, as pressure maystill be uniform across the
flame. The fourth-order term is basically linear and is included to damp high-frequency modes
and to allow the scheme to approach a steady state. Only this term affects the linear stability
of the scheme. It reduces to zero near discontinuities.
66 PMBFS2 User’s Manual

## 페이지 76
Chapter 8. Spatial Discretization
8.3 Upwind Scheme
Flux-Vector Splitting(FVS) and Flux-Difference Splitting(FDS)
8.3.1 Roe Scheme
In the flux-difference splitting (FDS) method of Roe, the interface flux in the direction is
written
1 (cid:163) (cid:164)
F = F(q )+F(q )−|A(q ,q )|(q −q ) (8.13)
i+1 2 2 L R L R R L i+1 2
where A is the inviscid Jacobian A evaluated with Roe-averaged variables,
A = A(q)
The Roe matrix has the following properties (for ease of notation the subscript i+1/2 is
omitted here):
(1) A(q,q) = A(q)
(2) A(q ,q ) has a complete set of real eigenvalues and eigenvectors.
L R
(3) A(q ,q )·(q −q ) = F(q )−F(q )
L R R L R L
The construction of this matrix is based on Roe’s approximate Riemann solver. The Roe
matrixisobtainedwhenthefollowingaveragevaluesareusedforthecalculationofitseigenvalues
and eigenvectors:
√
ρ = ρ ρ
L R
√ √
(u ρ) +(u ρ)
j L j R
u = √ √ , j = x,y,z (8.14)
j
ρ + ρ
L R
√ √
(H ρ) +(H ρ)
L R
H = √ √
ρ + ρ
L R
The matrix |A| is then calculated by
−1
|A| = T|Λ|T (8.15)
−1
where T and T are the right and left eigenvector matrices of A. The absolute eigenvalues
|λ | of the Roe matrix are redefined in order to avoid entropy condition-violating expansion
k
shocks[23]:

 |λ | if |λ | ≥ ε
k k
|λ
k
| =

λ2
k
+ε2
if |λ | < ε
(8.16)
k
2ε
where ε is a small number. Special care has to be taken when the entropy fix is applied to the
eigenvalues which correspond to the linear characteristic fields. In Euler flows, these fields are
associated with contact discontinuities. The entropy correction modifies the modulus of the near
zero eigenvalues and therefore falsifies the upwind term in Eq. (8.13). This becomes particularly
important for Navier-Stokes calculations since an incorrect representation of the eigenvalues can
result in an artificial boundary layer, i.e. too much artificial dissipation is added. Therefore for
all calculations ε is set to zero for the linear fields.
PMBFS2 User’s Manual 67

## 페이지 77
8.3. Upwind Scheme
8.3.2 High Order MUSCL Method
The spatial derivatives of the convective and pressure terms are written conservatively as a
flux balance across a cell as, for example,
(δ F) = F −F (8.17)
ξ i i+1 i−1
2 2
wheretheiindexdenotesacell-centerlocationandi±1/2correspondstoacell-interfacelocation.
Theinterfacefluxisdeterminedfromastate-variableinterpolationandalocallyone-dimensional
flux model. For flux-vector splitting (FVS), Equation (8.17) is split into forward and backward-
moving pieces as:
(cid:179) (cid:180)
(cid:163) (cid:164) (cid:163) (cid:164)
(δ F) = δ−F++δ+F− = F+(q )+F−(q ) − F+(q )+F−(q ) (8.18)
ξ i ξ ξ L R i+1 L R i−1
i 2 2
For flux-difference splitting (FDS), the interface flux is written as an exact solution to an ap-
proximate Riemann problem as:
1 (cid:163) (cid:164) 1 (cid:163) (cid:164)
(δ F) = F(q )+F(q )−|A|(q −q ) − F(q )+F(q )−|A|(q −q )
ξ i 2 L R R L i+1 2 L R R L i−1
2 2
(8.19)
Further details on the FVS and FDS methods are given in below sections. In both cases, in-
terpolated values q and q at each interface are required. The state variable interpolations
L R
determine the resulting accuracy of the scheme. They are constructed from interpolation of the
primitive variables.
For first-order fully-upwind differencing:
(q ) = q
L i+1 i
2
(q ) = q (8.20)
R i+1 i+1
2
Higher order accuracy is given by the family of interpolations:
1
(q ) = q + [(1−κ)∆ +(1+κ)∆ ]
L i+ 2 1 i 4 − + i
1
(q ) = q − [(1−κ)∆ +(1+κ)∆ ] (8.21)
R i+1 2 i+1 4 + − i+1
where
(∆ ) = q −q
+ i i+1 i
(∆ ) = q −q
− i i i−1
The parameter κ ∈ [−1,1] forms a family of difference schemes. κ = −1 corresponds to second-
order fully-upwind differencing, κ = 1/3 to third-order upwind-biased differencing, and κ = 1 to
central differencing. Note, however, that setting κ = 1 in the code will result in odd-even point
decoupling, since there is no artificial dissipation in the code. Also note that “third order” for
κ = 1/3 is only obtained for one-dimensional flows. For two and three dimensions, the formal
order of accuracy is second order.
In practice, the gradients of density and pressure are biased by an average value in order
to improve the robustness of the calculation at higher Mach numbers and in the early transient
stages of a solution.
68 PMBFS2 User’s Manual

## 페이지 78
Chapter 8. Spatial Discretization
∆
∆b = +
+ q + 1∆
i 2 +
∆
∆b = − (8.22)
− q − 1∆
i 2 −
And,
(cid:104) (cid:105)
q
(q ) = q + i (1−κ)∆b +(1+κ)∆b
L i+1 2 i 4 (cid:104) − + i (cid:105)
q
(q ) = q − i+1 (1−κ)∆b +(1+κ)∆b (8.23)
R i+ 2 1 i+1 4 + − i+1
Note that the above equation is not performed for the gradients of velocity; this is essentially an
extrapolation of the log of the density and pressure (first-order expansion).
8.3.2.1 Flux Limiter
For solutions with discontinuities (such as shock waves), schemes of order higher than one
generally require a flux limiter to avoid numerical oscillations in the solution. Here, we discuss
the usual limiters.
The smooth limiter (iflim = 1) is implemented via
(cid:110) (cid:111)
s
(q ) = q + [(1−κs)∆ +(1+κs)∆ ]
L i+1
2
i
4 (cid:110)
− +
i(cid:111)
s
(q ) = q − [(1−κs)∆ +(1+κs)∆ ] (8.24)
R i+ 2 1 i+1 4 + − i+1
where
2∆ ∆ +ε
+ −
s = (8.25)
(∆ )2+(∆ )2+ε
+ −
and ε is a small number (ε = 1−6) preventing division by zero in regions of null gradient.
The min-mod limiter (iflim = 2) is implemented via
1 (cid:163) (cid:164)
(q ) = q + (1−κ)∆ +(1+κ)∆
L i+1 2 i 4 − + i
1 (cid:163) (cid:164)
(q ) = q − (1−κ)∆ +(1+κ)∆ (8.26)
R i+1 2 i+1 4 + − i+1
where
∆ = minmod(∆ ,b∆ )
− − +
∆ = minmod(∆ ,b∆ ) (8.27)
+ + −
minmod(x,y) = max{0,min[xsign(y),ysign(x)]}sign(x) (8.28)
The parameter b is a compression parameter, b = (3−κ)/(1−κ).
The smooth limiter tuned to κ = 1/3 (iflim = 3) is implemented as follows.
1
(q ) = q + Lim(q −q ,q −q )
L i+1
2
i
2
i+1 i i i−1
1
(q ) = q − Lim(q −q ,q −q ) (8.29)
R i+ 2 1 i+1 2 i+1 i i+2 i+1
PMBFS2 User’s Manual 69

## 페이지 79
8.3. Upwind Scheme
where
x(y2+2ε2)+y(x2+2ε2)
Lim(x,y) = (8.30)
2x2−xy+2y2+3ε2
and Lim is designed to recover the state variable to third-order accuracy in the one-dimensional
case in smooth regions of the flow and interpolate without oscillations near discontinuities. The
parameterε2 isasmallconstantoforder∆x3 whichisusedtoimprovetheaccuracynearsmooth
extremum and reduce the nonlinearity of the interpolation in regions of small gradient.
70 PMBFS2 User’s Manual

## 페이지 80
Chapter 9
Temporal Discretization
The time scales of turbulence are very small and the evolution of turbulent structures is very
rapid. As a result, in DNS and LES of transitional and turbulent flows the time step is not
determined by stability considerations but from time resolution requirements. For this class of
problems, explicit schemes, which are computationally efficient, easy to parallelize, and provide
high accuracy in time, are the methods of choice. In many cases, use of explicit methods is
also necessary for wave propagation applications, such as aeroacoustics, where dissipation and
dispersion must be kept at very low level. For this class of problems, optimized explicit schemes
have been developed.
In many CFD applications, steady-state solutions are needed. Convergence to a steady state
is often obtained using explicit and/or implicit methods with multigrid acceleration or with
implicit methods. For time-depended aerodynamic problems, where time accuracy is of interest,
such as rotor aerodynamics, time integration of the Euler and Navier-Stokes equations is often
obtained with implicit methods that are second order accurate in time. Implicit methods [8]
are more intensive computationally compared to explicit methods and they do not offer high
accuracy in time. However they do not have limitations in time step due to numerical stability
for highly stretched meshes required for viscous flow simulations. Another class of methods
for time integration of time-dependent viscous flow problems is explicit methods with multigrid
acceleration and dual time stepping. Multigrid methods [6] and [7] for convergence acceleration
is a wide topic and will not be presented here. A brief overview of explicit and implicit method
used in CFD is given in the following sections.
9.1 Explicit Time Integration
Time integration can be obtained with the method of lines by considering the governing
equations as a system of ordinary differential equations ODEs in time where the right-hand side
containsthespacediscretization. PossiblechoicesforexplicittimesteppingoftheseODEsarethe
third-orhigher-orderexplicitlinearmultistepmethods(LMMs). Fornon-stifformoderatelystiff
multidimensional problems, high-order accuracy (higher than second) temporal accuracy may be
obtained with the Runge-Kutta (RK) methods. RK methods advance in time the following
semi-discrete form of the governing equations U = R(U), where R is the spatial discretization
t
operator.
A general RK can be written in the form
In many CFD applications the third-order (TVD) Runge–Kutta method, RK3-TVD [19]
that is compatible with TVD, ENO or WENO schemes was used. This RK method is TVD in
71

## 페이지 81
9.1. Explicit Time Integration
the sense that the temporal operator itself does not increase the total variation of the solution.
The TVD property of the time integration scheme plays an important role for time marching of
nonlinear hyperbolic problems. For multidimensional calculations storage is usually of impor-
tance. Therefore, in [11] and [59] low storage RK method, which only require two storage units,
have been developed.
Numerical schemes for computations of wave propagation have special requirements. In
computational aeroacoustics, for example, numerical schemes that have minimal dissipation and
dispersion errors in both time and space discretization are desired because the acoustic waves
are non-dispersive and non-dissipative in their propagation. High-order spatial discretization
is applied in aeroacoustics while time integration is often performed with RK methods. In
the multistage RK methods, the coefficients are chosen such that the maximum possible order of
accuracyisobtainedforagivennumberofstages. Itispossible,however,Huetal. [24],tochoose
the coefficients of the RK method so as to minimize the dissipation and dispersion errors for the
propagation of waves, rather than to obtain the maximum possible formal order of accuracy.
The optimized schemes are referred to in [24] as low-dissipation, low-dispersion RK (LDDRK)
schemes. Optimizationstrategiesofnumericalschemesforwavepropagationhasbeenconducted
inseveralotherstudies[21]and[50]. TheLDDRKschemeshavecertainadvantagesbecausethey
are applicable to different spatial discretization methods. The optimization is carried out only
for the resolved wavenumbers in the spatial discretization, they preserve the frequency in the
time integration and thus are dispersion relation preserving in the sense of [50], and they are low
storage.
9.1.1 Runge-Kutta Scheme
A fourth-order Runge-Kutta (RK4) scheme is used to solve the governing equations due to
√
its higher temporal accuracy and relatively larger CFL number (i.e. 2 2 for Euler calculation
using RK4). A thorough investigation of the stability characteristics of RK4 method, based
on convection of the turbulence energy-spectrum, is performed by Apte and Yang (2001) to
establish its creditability and accuracy. The governing equation in the general coordinates can
be rewritten as
(cid:104) (cid:105)
i+1/2,j,k i,j+1/2,k i,j,k+1/2
∆Q = H·∆t−∆t (E −E )| + (F −F )| + (G −G )| (9.1)
ξ ξv i−1/2,j,k η ηv i,j−1/2,k ζ ζv i,j,k−1/2
Using the four-stage Runge-Kutta scheme, each temporal-integration is completed through
four consecutive intermediate steps, as given below.
Q = Qn
0
Q = Q +α ∆t.R(Q )
1 0 1 0
Q = Q +α ∆t.R(Q ) (9.2)
2 0 2 1
Q = Q +α ∆t.R(Q )
3 0 3 2
Qn+1 = Q +∆t.R(Q )
0 3
where
(cid:104) (cid:105)
i+1/2,j,k i,j+1/2,k i,j,k+1/2
R(Q) = H− (E −E )| + (F −F )| + (G −G )| (9.3)
ξ ξv i−1/2,j,k η ηv i,j−1/2,k ζ ζv i,j,k−1/2
Superscripts’n’and’n+1’standforthesolutionatthe’nth’and’n+1th’timesteps,respectively.
Evaluation of the ∆Q = Qn+1−Qn term is thus performed as explained above. The coefficients
72 PMBFS2 User’s Manual

## 페이지 82
Chapter 9. Temporal Discretization
α , α , and α can be varied to obtain a variety of schemes with different stability properties.
1 2 3
The standard four-stage scheme has the following values (Jameson (1983)):
1 1 1
α = ,α = ,α = (9.4)
1 2 3
4 3 2
In order to enhance numerical efficiency and minimize the complexity arising from the irreg-
ular shape of the computational mesh, a curvilinear coordinate transformation of the governing
equations is employed so that the grid spacing in the transformed domain is unity. This is
equally important for the use of spatial filtering in the LES technique. Non-uniform filter sizes
directlyviolatetheassumptionsbehindthefilteringapproachandonehastoapplythenumerical
methodology in the body-fitted coordinate system.
9.2 Implicit Time Integration
An implicit time marching method that was used successfully in computations where high
order of spatial accuracy was implemented with finite differences is the approximately factored
Beam-Warming algorithm [4] augmented with Newton-like subiterations in order to achieve
second-order time accuracy. The factored implicit Beam-Warming algorithm, as well as other
implicittimemarchingschemes, assumessecond-orderaccurateintimelinearizationofthefluxes
F(U) as follows:
As a result, these schemes can achieve second order of accuracy in time at most, provided
that linearization errors are eliminated during the time integrations process. Therefore, for time
accurate solutions with the Beam-Warming algorithm and other implicit algorithms require one
or more Newton-type subiterations in order to eliminate linearization and/or factorization errors
and obtain second-order accuracy in time.
The approximately factorized Beam-Warming (BW) algorithm is compatible with centered
finite difference discretizations of right-hand side and is often used in CFD application. Central
differences on the right-hand side of the BW-factored algorithm were replaced by first-order
upwinding using Steger-Warming flux vector splitting [39] for numerical solution with upwind
discretizations of the right-hand side. The BW algorithm is formally second accurate in space
and compatible with centered discretizations of right-hand side. For higher-order discretizations
of the right-hand side, high-order accuracy of the implicit operators was obtained [16] where
the derivatives in the LHS operator were evaluated with a fourth-order accurate, three-point,
compact stencil. Using a fourth-order accurate compact scheme for the evaluation of the right-
hand side the algorithm has fourth-order formal accuracy in space. The resulting high-order
accurate in space implicit, compact algorithm was tested and analyzed in [16] and [17]. It was
found that it is unconditionally stable in two dimension as the original Beam-Warming second-
order accurate algorithm. Furthermore, it was shown that it yields accurate solutions of time
dependent problems with fewer subiterations and converges faster to the steady state [16].
Starting from the control volume formulation Yoon and Jameson [61] obtained an unfactored
implicit scheme from the nonlinear implicit scheme by linearizing the flux vectors about the
precedingtimestepanddroppingtermsofsecondorderorhigher. Recently, theLU-SGSscheme
was further extended by Zhang and Wang [63] for time accurate solutions by introducing dual
PMBFS2 User’s Manual 73

## 페이지 83
9.2. Implicit Time Integration
time-stepping.
(cid:181) (cid:182) (cid:181) (cid:182)
Qn+1−Qn ∂E ∂F ∂G n+1 ∂E ∂F ∂G n
i,j,k i,j,k
+ ω + + +(1−ω) + +
∆τ ∂ξ ∂η ∂ζ ∂ξ ∂η ∂ζ
i,j,k i,j,k
(cid:181) (cid:182)
∂Ev ∂Fv ∂Gv n
= + + (9.5)
∂ξ ∂η ∂ζ
i,j,k
According to
∂E ∂F ∂G
A = , B = , C = (9.6)
∂Q ∂Q ∂Q
and
(cid:175) (cid:175)
∂E(cid:175)n ∂E(cid:175)n
En+1 = En + (cid:175) ∆τ+o(∆τ2) = En + (cid:175) ∆Qn+o(∆τ2) = En +An ∆Qn+o(∆τ2)
i,j,k i,j,k ∂τ (cid:175) i,j,k ∂Q (cid:175) i,j,k i,j,k
i,j,k i,j,k
Fn+1 = Fn +Bn ∆Qn +o(∆τ2)
i,j,k i,j,k i,j,k i,j,k
Gn+1 = Gn +Cn ∆Qn +o(∆τ2)
i,j,k i,j,k i,j,k i,j,k
we have
(cid:183) (cid:184)
∆Qn ∂ ∂ ∂
+ ω (A∆Qn)+ (B∆Qn)+ (C∆Qn)
∆τ ∂ξ ∂η ∂ζ
(cid:181) (cid:182) (cid:181) (cid:182)
∂E ∂F ∂G n ∂Ev ∂Fv ∂Gv n
= − + + + + + = −RHS (9.7)
∂ξ ∂η ∂ζ ∂ξ ∂η ∂ζ
9.2.1 Diagonalized ADI
Considering the Steger-Warming splitting,
1
λ± = (λ±|λ|)
2
A = A++A−
(cid:163) (cid:161) (cid:162)(cid:164)
I +∆τω δ A++δ A−+δ B++δ B−+δ C++δ C− ∆Qn = −∆τ RHS (9.8)
ξ ξ η η ζ ζ
Using LU approximate factorization,
(cid:104) (cid:179) (cid:180)
I +∆τω A+ −A+ +B+ −B+ +C+ −C+
i,j,k i−1,j,k i,j,k i,j−1,k i,j,k i,j,k−1
(cid:179) (cid:180)(cid:105)
+ ∆τω A− −A− +B− −B− +C− −C− ∆Qn
i+1,j,k i,j,k i,j+1,k i,j,k i,j,k+1 i,j,k
(cid:104) (cid:179) (cid:180)(cid:105)
≈ I +∆τω A+ −A+ +B+ −B+ +C+ −C+
i,j,k i−1,j,k i,j,k i,j−1,k i,j,k i,j,k−1
(cid:104) (cid:179) (cid:180)(cid:105)
I +∆τω A− −A− +B− −B− +C− −C− ∆Qn
i+1,j,k i,j,k i,j+1,k i,j,k i,j,k+1 i,j,k
= −∆τ RHS (9.9)
LU ∆Q = −∆τ RHS (9.10)
Let U∆Q = ∆Q then
L∆Q = −∆τ RHS
74 PMBFS2 User’s Manual

## 페이지 84
Chapter 9. Temporal Discretization
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I +∆τω A+ −A+ +B+ −B+ +C+ −C+ ∆Q = −∆τ RHS
i,j,k i−1,j,k i,j,k i,j−1,k i,j,k i,j,k−1
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I +∆τω A+ +B+ +C+ ∆Q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
−∆τ RHS +∆τω A+ +B+ +C+ ∆Q
i−1,j,k i,j−1,k i,j,k−1
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I +∆τω A+ +B+ +C+ ∆Q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
−∆τ RHS +∆τω A+ ∆Q +B+ ∆Q +C+ ∆Q
i−1,j,k i−1,j,k i,j−1,k i,j−1,k i,j,k−1 i,j,k−1
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I +∆τω A+ +B+ +C+ ∆q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
−∆τ RHS +∆τω A+ ∆q +B+ ∆q +C+ ∆q (9.11)
i−1,j,k i−1,j,k i,j−1,k i,j−1,k i,j,k−1 i,j,k−1
U∆Q = ∆Q
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I +∆τω A− −A− +B− −B− +C− −C− ∆Qn = ∆Q
i+1,j,k i,j,k i,j+1,k i,j,k i,j,k+1 i,j,k
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I −∆τω A− +B− +C− ∆Q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
∆Q−∆τω A− +B− +C− ∆Q
i+1,j,k i,j+1,k i,j,k+1
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I −∆τω A− +B− +C− ∆Q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
∆Q−∆τω A− ∆Q +B− ∆Q +C− ∆Q
i+1,j,k i+1,j,k i,j+1,k i,j+1,k i,j,k+1 i,j,k+1
(cid:104) (cid:179) (cid:180)(cid:105)
⇒ I −∆τω A− +B− +C− ∆q =
i,j,k i,j,k i,j,k
(cid:179) (cid:180)
∆q−∆τω A− ∆q +B− ∆q +C− ∆q (9.12)
i+1,j,k i+1,j,k i,j+1,k i,j+1,k i,j,k+1 i,j,k+1
9.2.2 LU-SSOR and LU-SGS
Considering the maximum eigenvalue splitting,
1
λ± = (λ ±λ ), λ = max(|λ |,|λ |,...,|λ |) (9.13)
i 2 i max max 1 2 n
1 1
A± = (A±λ I), F± = A±Q = (F ±λ Q)
max max
2 2
and
A±βγ I
A± = A , γ = max|λ(A)|
A
2
B±βγ I
B± = B , γ = max|λ(B)|
B
2
C ±βγ I
C± = C , γ = max|λ(C)|
C
2
A+−A− = βγ I, B+−B− = βγ I, C+−C− = βγ I
A B C
Equation (9.7) can be written as
(cid:183) (cid:184)
∆Qn ∂ ∂ ∂
+ω [(A+−A−)∆Qn]+ [(B+−B−)∆Qn]+ [(C+−C−)∆Qn] = −RHS
∆τ ∂ξ ∂η ∂ζ
(9.14)
PMBFS2 User’s Manual 75

## 페이지 85
9.2. Implicit Time Integration
∆Qn
+ A− ∆Q −A−∆Q +A+∆Q −A+ ∆Q
ω∆τ i+1 i+1 i i i i i−1 i−1
+ B− ∆Q −B−∆Q +B+∆Q −B+ ∆Q
j+1 j+1 j j j j j−1 j−1
1
+ C− ∆Q −C−∆Q +C+∆Q −C+ ∆Q = − RHS
k+1 k+1 k k k k k−1 k−1 ω
A− ∆Q +B− ∆Q +C− ∆Q −A+ ∆Q −B+ ∆Q −C+ ∆Q
i+1 i+1 j+1 j+1 k+1 k+1 i−1 i−1 j−1 j−1 k−1 k−1
∆Qn 1
+ +(βγ ∆Q +βγ ∆Q +βγ ∆Q ) = − RHS (9.15)
A i B j C k
ω∆τ ω
Using LDU approximate factorization
1
D ∆Q +D∆Q+D ∆Q = − RHS (9.16)
− − + +
ω
(cid:183) (cid:184)
1
D = +βγ +γ +γ I
A B C
ω∆τ
D ∆Q = −(A+ ∆Q +B+ ∆Q +C+ ∆Q )
− − i−1 i−1 j−1 j−1 k−1 k−1
D ∆Q = (A− ∆Q +B− ∆Q +C− ∆Q )
+ + i+1 i+1 j+1 j+1 k+1 k+1
and
1
(LD−1U)∆Q = − RHS (9.17)
ω
L = D+D , U = D+D
− +
Let ∆Q = D−1U∆Q, then
1
L∆Q = − RHS
ω
(cid:183) (cid:184)
1 1
+βγ +γ +γ ∆Q = − RHS +(A+ +B+ +C+ )∆Q
ω∆τ A B C ω i−1 j−1 k−1
1
= − RHS +E+ (Q)−E+ (Q)+F+ (Q)−F+ (Q)+G+ (Q)−G+ (Q)
ω i−1 i−1 j−1 j−1 k−1 k−1
1 1 (cid:163)(cid:161) (cid:162) (cid:164)
= − RHS + E(Q)+βγ Q −(E(Q)+βγ Q)
ω 2 A A i−1
1 (cid:163)(cid:161) (cid:162) (cid:164)
+ F(Q)+βγ Q −(F(Q)+βγ Q)
2 B B j−1
1 (cid:163)(cid:161) (cid:162) (cid:164)
+ G(Q)+βγ Q −(G(Q)+βγ Q) (9.18)
2 C C k−1
D−1U∆Q = ∆Q
∆Q = ∆Q−D−1D ∆Q = ∆Q−D−1(∆E− +∆F− +∆G− )
+ i+1 j+1 k+1
1 (cid:163)(cid:161) (cid:162) (cid:164)
= ∆Q− D−1 E(Q)−βγ Q −(E(Q)−βγ Q)
2 A A i+1
1 (cid:163)(cid:161) (cid:162) (cid:164)
− D−1 F(Q)−βγ Q −(F(Q)−βγ Q)
2 B B j+1
1 (cid:163)(cid:161) (cid:162) (cid:164)
− D−1 G(Q)−βγ Q −(G(Q)−βγ Q) (9.19)
2 C C k+1
76 PMBFS2 User’s Manual

## 페이지 86
Chapter 10
Parallel Computation
10.1 Parallel Architecture
Every computer, whether sequential or parallel, operates by executing instructions on data.
Depending on whether there is one or several of instruction and data streams, the computing
architecture can be classified into the following four categories (Flynn, 1966).
(1) Single Instruction stream, Single Data stream (SISD)
(2) Multiple Instruction streams, Single Data stream (MISD)
(3) Single Instruction stream, Multiple Data stream (SIMD)
(4) Multiple Instruction stream, Multiple Data stream (MIMD)
SISD computers are the standard sequential computer with single processor. In MISD com-
puters, each processor has its own control unit, but they share a common memory. However,
MISD machines are seldom used in practice. For SIMD computer, all processors operate under
the control of a single instruction stream. TMC CM-200, MasPar, ICL DAP can be regarded as
SIMD machines. However, the most widely used computing architecture is the MIMD system.
In this configuration, each processor has its own data set and also a set of instructions to follow.
These processors work independently of each other on these data sets and only communicate
at some point during the computation where the data set and the results obtained are shared by
two or more processors. MIMD-type computers include IBM SP-2, Cray T3E, CM5 and Beowulf
Clustered computers.
For an SIMD or MIMD system, it is usually necessary to exchange date between processors.
This can be done in two different ways: 1) Shared Memory systems, and 2) Distributed memory
systems. The shared memory system consists of global address space, which is accessible by
all the processors and thus the memory is shared among these processors. One processor can
communicate with other processors by writing into or reading from the global memory. This
architecture inherently solves the inter-processor communication problem, but introduces bottle-
neck problems created from the simultaneous access of the memory by more than one processor.
In the distributed memory systems, each processor has its own local (or private) memory and
the global/shared memory is absent. The processors are connected externally to switches and
network of wires to allow communications among them. The efficiency of these systems is based
on the communication time required among these processors. The system enjoys several advan-
tages such as hardware compatibility, functionality, and performance. The only drawback of this
77

## 페이지 87
10.2. Domain Decomposition
architecture is the enormous responsibility placed on software programmers. The programmers
mustprovideanefficientschemetodistributethedataandsetofinstructions, andalsoexplicitly
provide the instruction set for communications among the various CPUs. This requires recon-
struction of the numerical algorithm and synchronization of the processors for efficient, parallel
computing.
10.2 Domain Decomposition
Because the explicit time stepping numerical scheme (RK4) is applied in the current study,
only the neighboring data instead of the data from the entire computational domain is required
during the calculation of flow variables in each cell. The data dependence is weak. The do-
main decomposition technique is best suitable for this kind of application. It is also commonly
implemented in distributed-memory parallel computer systems. In the field of computational
fluid dynamics (CFD), it is generally referred to as mesh partitioning, based on the geometric
substructure of the computational domain.
Figure 10.1: Schematic of a two-dimensional sub-domain with ghost cells.
Inadomain-decompositiontechnique,thephysicaldomainisdividedintoseveralsub-domains.
Variables in each cell are updated to the next time step simultaneously. In order to calculate
the spatial derivatives at the sub-domain boundaries, ghost cells or halo data around the com-
puting cells are introduced. Figure 10.1 shows an example of a two dimensional sub-domain
with ghost cells. Because the variables in the ghost cell are updated in another sub-domain,
message passing is required to synchronize data between different sub-domains. The commu-
nication overhead is directly proportional to the volume-to-surface ratio of the grid system in
thatsub-domain. Maximizingthecomputation-to-communicationratioleadstoahigherparallel
execution efficiency.
10.3 Parallel Programming
10.3.1 Message Passing
The Message Passing Interface (MPI) library is employed for parallel processing of both
the gas and droplet phases. The flowfield is first decomposed into a number of subdomains.
Droplets are initially assigned to different subdomains based on their initial locations. During
time marching, the droplet may move from one subdomain to another. In order to overcome the
relatively long latency of short messages, the data objects corresponding to the droplets/parcels
78 PMBFS2 User’s Manual

## 페이지 88
Chapter 10. Parallel Computation
that move to the ghost cells (i.e., pass the internal boundary) are packaged into buffers. At the
end of each step, the data stored in the buffers are sent to adjunct subdomains within a large
buffer. The high cost of latency associated with message passing is consequently minimized,
resulting in a reduced communication overhead at the expense of increased memory. Because
the data communication represents a major challenge in the current work, this approach can
effectively decrease the overall computing time.
10.3.2 Hybrid MPI/OpenMP
Hybrid MPI/OpenMP method will be utilized in PMBFS2 code, which will improve the
parallel performance in wide parallel computers. The hybrid MPI/OpenMP method is obtained
by using message-passing interface (MPI) for inter-zone parallelism, and by using OpenMP di-
rectives for intra-zone parallelism.
A two-level parallelization paradigm is developed by the hybrid of both geometric domain
decomposition and data decomposition techniques. It is based on single program multiple data
(SPMD) and multiple instruction multiple data (MIMD) programming paradigm. Here data
communication between domains is based on message-passing interface (MPI) [20] and OpenMP
standard [36] is used to decompose loop iterations arrays. The flowchart presented in Fig. 10.2
depicts the two-level parallelization strategy using both MPI and OpenMP.
Original Mesh
Geometric Domain Decomposition – Communication via MPI
Distributed-Memory
Single ProgramMultiple Data (SPMD)
MPI Processor 1 MPI Communications MPI Processor 2
Data Decomposition - OpenMP Data Decomposition - OpenMP
Thread 0 Thread 1 Thread 2 Thread 3 Thread 0 Thread 1 Thread 2 Thread 3
Shared-Memory Multiprocessing (SMP) Shared-Memory Multiprocessing (SMP)
Multiple Instruction Multiple Data (MIMD) Multiple Instruction Multiple Data (MIMD)
Figure 10.2: Two-level parallelization strategies using MPI with OpenMP showing 2 MPI pro-
cessors and 4 OpenMP threads.
10.3.3 Overlapping Communication and Computation
The major obstacle in achieving the ideal parallel performance sterns from the interprocessor
communication costs due to both bandwidth and latency limitations of the available hardware.
Oneofthepossiblewaysofperformanceimprovementistooverlapcommunicationandcomputa-
tion by combining nonblocking communication with an appropriate structure of the message
passing calls in the program.
PMBFS2 User’s Manual 79

## 페이지 89
10.3. Parallel Programming
In nonblocking communication, two calls are necessary to send a message buffer. The send
start call returns control to the program immediately after the send has been posted. The
program can then proceed with computation, autonomously of the communication call handled
by the communication controller. To verify that the outgoing buffer was safely copied out by the
controller, an additional send complete call is necessary. The nonblocking receive operation
consists of the two similar stages, accomplished by correspondingly receive start and receive
complete calls.
Whenever possible, nonblocking communication has been used throughout the flow solver.
The following schematic arrangement of the calls has been adopted in the communication sub-
routine (in twodimensions),
1. Post the nonblocking receive start calls for all four i,j neighbors.
2. Package the outgoing buffer for the j ∼ (lower) neighbor.
3. Immediately post a nonblocking send start for the j ∼ neighbor.
4. Package the outgoing buffer for the j+ (upper) neighbor.
5. Immediately post a nonblocking send start for the j+ neighbor.
6. Wait for all pending j-sweep send and receive calls to complete.
7. Retrieve data from the incoming buffers received from j+,j ∼ neighbors.
8. Package the outgoing buffer for the i ∼ (left) neighbor.
9. Immediately post a nonblocking send start for the i ∼ neighbor.
10. Package the outgoing buffer for the i+ (right) neighbor.
11. Immediately post a nonblocking send start for the i+ neighbor.
12. Wait for all pending i-sweep send and receive calls to complete.
13. Retrieve data from the incoming buffers received from i+,i ∼ neighbors.
14. Return to the main program.
Theveryfirststepofpostingthenonblockingreceivestartcallshelpstoavoidsystembuffering
andmemory-to-memorycopyingbyallowingtheinformationtobeprovidedearlyonthelocation
of the receive buffer. Note also that the j-sweep completion is enforced before the outgoing i-
sweep information can be sent. This ensures the proper transfer of the corner variables. Finally,
the use of the nonblocking send start calls allows to perform the data packaging and retrieving
functions concurrently with the communication calls.
10.3.4 Load balance
Thephysicaldomaindecompositionforparallelizationinthepresentworkisintuitive. Itmay
lead to the disparity of the computation workload in the processor array and the communication
overheadassociatedwiththemessagepassingofthesimulationresults. Thisunevenloadbalance
may be identified as an important performance degrader.
In a broad term, the load placed on a processor in two-phase flow simulations is determined
by the numbers of numerical grids and droplets being computed upon the processor. These
droplets are free to move around the domains, and consequently the load on each processor
changes at each time step. Most flow calculations are arbitrarily initialized, and as a result the
initialdistributionofdropletscouldbequitedifferentfromthefinalconvergeddistribution. Even
if the initial domain decomposition gives a perfect load balance, the computation may have a
very bad balance later on.
Because of the structured grid implemented in the present work, it is inconvenient to de-
compose the domain dynamically. In order to overcome this serious load balance problem in a
two-phase flow simulation, the dynamic domain reallocation is introduced. Generally speaking,
the overall domain is decomposed into n subdomains and the number of subdomains is larger
80 PMBFS2 User’s Manual

## 페이지 90
Chapter 10. Parallel Computation
than the number of processors, m. Therefore, one or more subdomains are assigned to each
processor. The load function is calculated in each processor
(cid:88)(cid:161) (cid:162)
f = α Ni +α Ni +α Ni (10.1)
Load 1 grid 2 particle 3 misc
i
where α is a weighting factor, and Ni represents the number in subdomain i. The subscripts,
(·)
grid, droplet, misc denote the grid, droplet, and miscellaneous terms, respectively.
The subdomains in each processor will be reallocated based on the communication load of
each processor.
PMBFS2 User’s Manual 81

## 페이지 91
10.3. Parallel Programming
82 PMBFS2 User’s Manual

## 페이지 92
Chapter 11
Software Framework: Design, Structure
and Implementation
The report describes PMBFS2 — a general software software system for the simulation of
3-D turbulent reacting two-phase flows about complex geometries. Presently, the software treats
either perfect gases or air in chemical equilibrium. Closure of the Reynolds stresses is provided
by either the Baldwin-Lomax turbulence model, k − (cid:178) type model, k − ω type model, or the
others models.
The report emphasizes the software engineering aspects of creating a general multiblock/-
multigrid solver. A geographically distributed team of programmers are constructing the system
with the idea that it should be a highly ordered and comprehensible platform upon which new
formulations and methods can be incorporated in the future by people who did not participate
in writing the original code.
The key to a successful multiblock parallel code, particularly if it is to serve as an evolving
platform, lies in the design of a suitable data structure and a concept for the management of the
data.
With such a data structure we have designed a general framework of modular coding that
incorporates variousspatialdiserctization schemesbasedon eithercentralor upwinddifferencing
and either explicit of implicit time integration. Residual averaging and a multigrid technique
accelerate the intermediate or ultimate convergence of the calculation.
11.1 Introduction
Thesimulationoffluidengineeringapplicationsrequiresthetreatmentofcomplexgeometrical
configurations. Astructured-meshsolveraccomplishesthisbytheso-calledmultiblockapproach,
wherethegridcanbecomposedofdifferentblocksofstructuredgrids. Codesdevelopedalongthis
concept have gotten the reputation of being very large, cumbersome and even incomprehensible,
and this has given added impetus to the interest in unstructured-mesh solvers. The present
paper refutes this connotation by describing a structured-mesh solver for the simulation of 3-D
turbulent reacting two-phase flows about complex geometries. We describe the structure of the
code, the logical relationships between its elements, and we focus on the philosophy underlying
its design.
Thecodeiswritteninageneralframeworkwithanovelsystemforinternaldatamanagement
that allows one to: (1) select the number and type of dependent variables to be solved; (2)
complement the Navier-Stokes equations with additional equations, e.g. species equations for
83

## 페이지 93
11.1. Introduction
chemical reactions or transport equations of turbulent quantities; and (3) choose a variety of
finite-volume schemes, based either on central or upwind discretization. This structure of the
data and our modular programming organizes the multiblock software into an understandable
code of less than 30,000 lines of FORTRAN.
The upwind options included in the code are TVD flux-difference splitting, and Weighted-
ENO,whilethecentralschemeisthestandardonewithblendedartificialviscosity. Eitherexplicit
Runge-Kutta time stepping or implicit time integration can be used. The implicit approach is
combined with point or line relaxation methods. The turbulence models included in the solver
are based on the algebraic RANS model or LES.
Themultiblockconceptisnotnew,ithasbeendevelopedandappliedtoavarietyofproblems
before. But the papers describing it usually focus on the algorithmic aspects of the methods and
on the specific application, commonly flow around a complex aircraft. The present report breaks
this trend by addressing the software engineering aspects of constructing a multiblock code.
We discuss a number of problems encountered in this approach, and we present our ways to
surmount them. The emphasis in the report, and its novelty, lies here, instead of in the realm of
new algorithmic developments.
11.1.1 Designing a Modular Software Environment
Theoverallrequirementsofthecontractcoupledwiththemultiteamcharacteroftheprogram
writersandthepossiblemultinationaluseoftheresultingsystemledusattheonsettoanumber
of design objectives for the software.
11.1.1.1 Design Objectives
Qualitative Goals (6Y)
• Modularity: third party extensions linked at runtime;
• Extensibility: easy to add new physical model and implementation;
• Flexibility: complex geometry and applications;
• Maintainability: clear structure for accelerated learning process;
• Scalability: capacity for evolution;
• Efficiency: minimize execution time.
Quantitative Goals (Features)
• Object-Oriented Design, hierarchical structure based on component modules
• Multi-Physics (Multi-Phase, Chemical Non-Equilibrium)
• Arbitrary Solver (FVM, FDM, HOC)
• Explicit and Implicit Schemes
• Multi-Grid Acceleration
• Parallel and Dynamic Load Balancing
84 PMBFS2 User’s Manual

## 페이지 94
Chapter 11. Software Framework: Design, Structure and Implementation
• Error-Estimation and Adaptivity
Since the code is intended for industrial application, it has to handle complex configurations
and flow geometries. From the beginning we choose to approach this objective with a multiblock
cell-centeredfinite-volumemethodusinggeneralhexahedralblocksofstructuredmeshesthatare
patchedorbuttedtogetheralongadjoiningfaces. Inorderforthecodetobepractical,ithastobe
efficient in terms of computing time and cost. A Runge-Kutta time stepping technique combined
with residual averaging or implicit time integration accelerates convergence to intermediate or
ultimate steady state. Since we are concerned with all types of aero-thermodynamic flows,
the code has to handle air in equilibrium as well as chemical non-equilibrium. In addition to
this generality it should be constructed so that it can be transported to a variety of different
computer architectures, ranging from classical supercomputers with restricted central memory,
to distributed memory parallel machines. But above all, because of the disjoint nature of the
programming teams, it is of utmost importance that the code be readable and comprehensible.
11.1.1.2 Design Philosophy
The PMBFS2 code is similar to DUNS project, which is quite different from most software
packagesthataredownloadablefromtheweb. CFDtendstobeaverycomputationallyintensive
field, so much so that a great deal of consideration has to go into making a program efficient or
else you end up waiting forever to obtain a solution. For large problems, even a slowdown of
10% can result in several hours of computational time, especially if you are working on a very
large problem or have a fairly slow computer.
The overall drive in software design today is to make things flexible, so that you compile a
set of sources once and run it for every case that it’s applicable for. There are several advantages
to this approach. First, compilation of large programs is a computationally intensive procedure,
and not much fun to do. This point is not terribly relevant for CFD because the time used for
compiling is generally very small compared to execution time and set up time.
A more important consideration, however, is the difficulty of keeping track of changes in
source code if you have several different copies of the source laying around. Often times, 95%
of the code between different sources will be the same, except for small changes to treat slightly
different conditions. Trouble starts when you want to update one small item in the basic code.
For this, you have to change the source in several different sets of sources, and although it is a
straightforward job, it is tedious and error prone.
In creating PMBFS2 , we have tried to solve the above problems while retaining an efficient
code base from which to work. Our solution is to have one set of distribution files from which all
of the source codes for the slightly different projects are derived. The distribution files (labeled
*.F90 and *.h), are interspersed with a Fortran or C preprocessor. This is described in more
detail below.
11.1.1.3 Comprehensible and Extensible Structure
Since our code is intended to be a software platform on which future contractors are to
build new models, it is essential that a new developer can enter the project and read, and with
relative ease understand, the coding that someone else has written. Adopting a well-defined
data structure, constructing the software in modular and hierarchical subelements and
defining a disciplined and unambiguous way to access and return data to storage,
all contribute strongly to making the system easy to learn. We have also established a set of
PMBFS2 User’s Manual 85

## 페이지 95
11.1. Introduction
FORTRAN programming rules to enforce a certain uniformity of style in the writing of
code, and this enhances its readability.
A new programmer learns about the code through its documentation. We have devised a
system for documenting the software that consists of three distinct types of documents. The
theoretical manual describes the operators of the subelements in mathematical terms much like
a scientific paper does. The programming manual presents flow charts, on the program as well
as subroutine level, in order to give an overview of the program control, and it describes all the
FORTRAN variable names that appear. This manual also includes the comment header for each
subroutine along with a list of the comments throughout the routine in order to annotate the
flow charts. Lastly the users guide instructs an intended user about the range of application
of the program, the input data he needs to prepare, and it describes the output resulting from
executing the code. It provides all the information needed to run the program.
11.1.1.4 Hierarchical Platform
Our design philosophy leads to software structure of hierarchical subelements that process
data stored in memory in a precise arrangement and accessed through a small set of utility
routines (Fig. 11.1). At the highest level are the multigrid and residual averaging routines for
convergence acceleration, next comes the time stepping and relaxation procedures, followed by
thoseforevaluatingthefluxandresiduals. Thismultilayeredsystemfulfillstheideaofasoftware
platform because once the lowest levels are in place, researchers can formulate and test new and
sophisticatedmathematicalproceduresatthehigherlevelswithouthavingtobeconcernedabout
how the data is handled or stored.
Figure 11.1: Software structured in layers from the lowest- to highest-level functions.
86 PMBFS2 User’s Manual

## 페이지 96
Chapter 11. Software Framework: Design, Structure and Implementation
11.1.2 PMBFS2 Framework
The following list is the basic framework of the PMBFS2 source code. The source files can
be categorized by their basic utilities.
PMBFS2/ +
|+ src/
| CHANGES.txt ## PMBFS2 version history
|
| Makefile ## Makefile system
| Make_Comm
| Make_Main
| Make_Post_Processing
| Makesystem_cygwin
| Makesystem_intel
|
| main.F90 ## main driver
|
| pmbfs.h ## data modules - header
| pmbfs_data_mod.F90 # data modules - defination
| pmbfs_mod.F90 # data modules - operation
|
| solve.F90 ## top level flow solver
| updtrt.F90
| rhs.F90
|
| cflux_upwind.F90 ## spatial discretization subroutines
| cflux_hybrid.F90
| cflux_central.F90
| artvis_m.F90
| artvis_s.F90
| vflux.F90
|
| solve_rk.F90 ## temporal discretization subroutines
| solve_diagadi.F90
| solve_lussor.F90
| timestep.F90
| smooth.F90
|
| bc.F90 ## physical boundaries subroutines
| bc_block.F90
| bc_moc.F90
| bc_parallel.F90 ## parallel boundaries subroutines
|
| eos.F90 ## EOS and transport quantities
| transp.F90
|
| propin.F90 ## fluid properties subroutines
| propin_c12h24.F90
PMBFS2 User’s Manual 87

## 페이지 97
11.1. Introduction
| propin_c2h4.F90
| propin_c3h8.F90
| propin_ch4.F90
| propin_o2h2.F90
|
| turb_models.F90 ## turbulent modeling subroutines
| turb_bldlmx.F90
| turb_spalart.F90
| turb_kepsln.F90
| turb_komega.F90
| turb_sgs.F90
| turb_wdist.F90
|
| chem.F90 ## chemical reacting subroutines
| chem_c12h24.F90
| chem_c2h4.F90
| chem_ignite.F90
|
| spray_module.F90 ## two-phase subroutines
| spray_variables.F90
| spray_physics.F90
| spray_solve.F90
| spray_mpi.F90
|
| metric.F90 ## geometry subroutines
|
| init_solver.F90 ## initialize subroutines
| init_flowfield.F90
| init_perturb.F90
|
| udf_init.F90 ## user defined functions
| udf_monitor.F90
| udf_postsolve.F90
|
| pmbfs_io.F90 ## input/output subroutines
|
| post_calc.F90 ## post-processing subroutines
| post_readspray.F90
| post_statistic.F90
|
| residual.F90 ## miscellaneous subroutines
| monitor.F90
| average.F90
| average_mod.F90
| check_value.F90
| tsolve.F90
|
| timer_mod.F90 ## performance monitor subroutines
88 PMBFS2 User’s Manual

## 페이지 98
Chapter 11. Software Framework: Design, Structure and Implementation
| lib.F90 ## library subroutines
|
|+ doc/ ## PMBFS2 documents
|
|+ vav/ + ## verification and validation cases
| |+ 2D/ +
| | |+ airfoil/
| | |+ bfs/
| | |+ cylinder/
| | |+ cylinder_p/
| | |+ rbcc/
| |+ 3D/ +
| | |+ cduct/
| | |+ cylinder_p/
PMBFS2 User’s Manual 89

## 페이지 99
11.2. Data Structure
11.2 Data Structure
11.2.1 Data Modules and Global Variables
11.2.1.1 Definition of parameter and class
The fortran module pmbfs_data_frame defines the basic parameters and data type modules
for the whole PMBFS2 code. The constant for various boundary conditions, turbulent models,
geometry constants and other constants.
!===============================================================================
! MODULE pmbfs_data_frame
!
! Description:
! Module file of data & variables for the Frame of Program PMBFS
! including definitions of parameter, class, and variables related
! with the Multi-Block strucutre, face, boundary conditions. All of
! those varaibles are independent of the applications.
!
! History:
! Version Date Comment
! ------- ---- -------
! 1.0.0 06/07/03 Data abstraction. Shanwu Wang
! 2.0.0 08/27/08 Unified turbulent reacting two-phase data module.
! Dong-Jun Ma
!===+====1====+====2====+====3====+====4====+====5====+====6====+====7====+====8
MODULE pmbfs_data_frame
implicit none
!
! dimension of the program, 2D or 3D
!
integer, parameter,private :: dim = 3, nface = dim*2, nvortex = (dim-1)*4
!
!--------------------------------
! Boundary condition constants
!--------------------------------
! definition of boundary conditions
! boundary conditions: physics boundary <=> Number
!
integer, parameter :: &
SUBSONIC_INFLOW =1, SUPERSONIC_INFLOW=2, SUBSONIC_OUTFLOW=3, &
SUPERSONIC_OUTFLOW=4, INVISCID_WALL =5, VISCID_WALL =6, &
PERIODIC_BOUNDARY =7, SINGULARITY =8, ENTRAINMENT =9, &
VISCID_WALLFUNC =10, FARFIELD_BC =11, NONREFLECTING_BC=12, &
BLOCK_BOUNDARY =20, NULL_BOUNDARY =0
!
! boundary conditions: Number <=> physics boundary String
!
character(len=*), dimension(0:20),parameter ::bc_char= &
(/’NULL_BOUNDARY ’, &
’SUBERSONIC_INFLOW ’, ’SUPERSONIC_INFLOW ’, ’SUBERSONIC_OUTFLOW’, &
’SUPERSONIC_OUTFLOW’, ’INVISCID_WALL ’, ’VISCID_WALL ’, &
’PERIODIC_BOUNDARY ’, ’SINGULARITY ’, ’ENTRAINMENT ’, &
’VISCID_WALLFUNC ’, ’FARFIELD_BC ’, ’NONREFLECTING_BC ’, &
90 PMBFS2 User’s Manual

## 페이지 100
Chapter 11. Software Framework: Design, Structure and Implementation
’UNDEFINED ’, ’UNDEFINED ’, ’UNDEFINED ’, &
’UNDEFINED ’, ’UNDEFINED ’, ’UNDEFINED ’, &
’UNDEFINED ’, ’BLOCK_BOUNDARY ’/)
!
!--------------------------------
! Turbulence modeling constants
!--------------------------------
!
integer, parameter :: TURB_MODEL_NONE = 0, & !
TURB_MODEL_BL = 10, & !*RANS 0eq Baldwin-Lomax
TURB_MODEL_SA = 110, & !*RANS 1eq Spalart-Allmaras
TURB_MODEL_KE = 210, & !*RANS 2eq k-epsilon
TURB_MODEL_KE_STD = 211, & ! RANS 2eq k-eps standard
TURB_MODEL_KE_LRE = 212, & ! RANS 2eq k-eps low Re
TURB_MODEL_KE_ASM = 213, & ! RANS 2eq k-eps EASM
TURB_MODEL_KW = 250, & !*RANS 2eq k-omega
TURB_MODEL_KW_WLX = 251, & ! RANS 2eq k-omega Wilcox
TURB_MODEL_KW_SST = 252, & ! RANS 2eq k-omega SST
TURB_MODEL_KW_ASM = 253, & ! RANS 2eq k-omega EASM
TURB_MODEL_LES = 500, & !*LES
TURB_MODEL_STASMAG = 510, & ! LES static Smagorinsky
TURB_MODEL_DYNSMAG = 520, & ! LES dynamic Smagorinsky
TURB_MODEL_DES = 600, & !*DES
TURB_MODEL_DESSA = 610, & ! DES Spalart-Allmaras
TURB_MODEL_DESKW = 620, & ! DES k-omega SST
TURB_MODEL_ILES = 700, & !*ILES Implicit LES
TURB_MODEL_DNS = 1000 !*DNS
!
!--------------------------------
! Geometry constants
!--------------------------------
! face number in the program
!
integer, parameter :: DIR_WEST = 1, DIR_EAST = 2, DIR_SOUTH = 3, &
DIR_NORTH = 4, DIR_BOTTOM = 5, DIR_TOP = 6
integer, parameter :: WEST_FACE = DIR_WEST, EAST_FACE = DIR_EAST, &
SOUTH_FACE = DIR_SOUTH, NORTH_FACE = DIR_NORTH, &
BOTTOM_FACE = DIR_BOTTOM,TOP_FACE = DIR_TOP
!
! face direction, I:1,J:2,K:3
!
integer, parameter,dimension (nface):: FACE_DIR = (/1,1,2,2,3,3/)
!
! face side, west, sourth,bottom:-1, others:+1
!
integer, parameter,dimension (nface):: FACE_SIDE = (/-1,1,-1,1,-1,1/)
!
! face string in the program
!
character(len=*), dimension(nface),parameter :: dir_char= &
(/’WEST ’,’EAST ’,’SOUTH ’,’NORTH ’,’BOTTOM’,’TOP ’/)
!
! the property (location) of the cell,
PMBFS2 User’s Manual 91

## 페이지 101
11.2. Data Structure
! inside cell (physical domain),
! boundary cell (one layer non-physical cells adjacent to physical cells)
! ghost cell (outside of boundary cells)
!
integer, parameter :: InternalCell = 1, GhostCell=-1, BoundaryCell=0
!
! define sevearl class for data strucutres employed
!
type face
integer :: t ! boundary type
integer :: gid,bid ! connected block’s group id, block id
integer :: dir(dim) ! connected block’s direction
end type face
type group
integer :: bn ! block number
integer, dimension(:),pointer :: b ! blocks
end type group
type vector_id
integer, dimension(dim) :: v
end type vector_id
!
! to select the direction
!
type(vector_id), parameter, dimension(dim):: selection_dir = &
(/vector_id((/1,0,0/)),vector_id((/0,1,0/)),vector_id((/0,0,1/))/)
END MODULE pmbfs_data_frame
92 PMBFS2 User’s Manual

## 페이지 102
Chapter 11. Software Framework: Design, Structure and Implementation
11.2.1.2 Data module for MPI communication
!=======================================================================
! MODULE pmbfs_data_mpi
!
! Description:
! MPI module for Program PMBFS
!
! History:
! Version Date Comment
! ------- ---- -------
! 1.0.0 06/07/03 Data abstraction. Shanwu Wang
! 2.0.0 08/27/08 Unified turbulent reacting two-phase data module.
! Dong-Jun Ma
!=======================================================================
MODULE pmbfs_data_mpi
IMPLICIT none
integer, parameter :: MASTER = 0
integer, parameter :: MAX_SNDRCV_PROC = 100
#ifdef PARALLEL
!
! MPI header file
!
include ’mpif.h’
!
! Declare global variables related to MPI
!
integer :: mpierr, status(MPI_STATUS_SIZE)
integer :: stats(MPI_STATUS_SIZE,MAX_SNDRCV_PROC*2)
# ifdef DOUBLEP
integer, parameter :: MPI_MY_REAL = MPI_DOUBLE_PRECISION
# else
integer, parameter :: MPI_MY_REAL = MPI_REAL
# endif
#endif
integer :: numprocs, myid
integer :: request, num_req
integer :: num_sndto_proc, num_rcvfrom_proc, total_sndrcv_cell
integer, dimension(MAX_SNDRCV_PROC*2):: req
integer, dimension(MAX_SNDRCV_PROC) :: my_sndto_proc, my_rcvfrom_proc
integer, dimension(MAX_SNDRCV_PROC) :: indxbeg_cell_snd, isize_cell_snd, &
indxbeg_cell_rcv, isize_cell_rcv
END MODULE pmbfs_data_mpi
PMBFS2 User’s Manual 93

## 페이지 103
11.2. Data Structure
11.2.1.3 Data module for global variables
!=======================================================================
! MODULE pmbfs_data
!
! Description:
! Module file of data & variables for Program PMBFS
! including definitions of parameter, class, and variables
!
! History:
! Version Date Comment
! ------- ---- -------
! 1.0.0 06/07/03 Data abstraction. Shanwu Wang
! 2.0.0 08/27/08 Unified turbulent reacting two-phase data module.
! Dong-Jun Ma
!=======================================================================
MODULE pmbfs_data
!
! definition of parameters for program frame
!
USE pmbfs_data_frame
!
! definition of parameters for parallel processing (MPI)
!
USE pmbfs_data_mpi
IMPLICIT none
!
! header file, need C preprocessor, define the size of the solver,
! such as dimension, equation number, and so forth
!
# include "pmbfs.h"
!----------------------------------------------------------------------
! Part I: Parameters in the program
!----------------------------------------------------------------------
!
! Define precision for real number
!
#if defined DOUBLEP
integer, parameter :: precision = KIND(1.0d0) ! double precision
#else
integer, parameter :: precision = KIND(1.0) ! single precision
#endif
real(precision), parameter :: REAL_SMALL = TINY(1._precision)
real(precision), parameter :: REAL_HUGE = HUGE(1._precision)
real(precision), parameter :: ONE = 1._precision, &
ZERO = 0._precision
!
94 PMBFS2 User’s Manual

## 페이지 104
Chapter 11. Software Framework: Design, Structure and Implementation
! Declare the global variablies used in Program PMBFS
!
!* total number of equations
integer, parameter :: neq = NEQ
!* number of flow equations
integer, parameter :: num_flow_eqns = NUM_FLOW_EQNS
!* number of turbulent transport equations
integer, parameter :: num_turb_eqns = NUM_TURB_EQNS
!* number of passive scalar equations
integer, parameter :: num_pass_eqns = NUM_PASS_EQNS
!* number of chemical species
integer, parameter :: nspe = NUM_SPEC
integer, parameter :: nsm = NSM
integer, parameter :: nblk_max = NUM_BLK_MAX ! max number of block
integer, parameter :: ncell = NUM_CELL_MAX ! max number of cells
integer, parameter :: ncell_bc = NUM_BCCELL_MAX ! max number of overlapping
! cells at block boundary
integer, parameter :: ndim_max = IJK_MAX ! max number of grids among
! xi, eta, and zeta-direction
integer, parameter :: ndim_min = -4 ! min location of grids
! along coordinates
! 5 ghost nodes at most
!* index of variables
!* [neqBgnFlow,neqEndFlow],[neqBgnTurb,neqEndTurb],[neqBgnPass,neqEndPass]
integer :: neqBgnFlow = 1, &
neqEndFlow = num_flow_eqns, &
neqBgnTurb = num_flow_eqns+1, &
neqEndTurb = num_flow_eqns+num_turb_eqns, &
neqBgnPass = num_flow_eqns+num_turb_eqns+1, &
neqEndPass = neq
!----------------------------------------------------------------------
! Part II: Configuration variables in the program
!----------------------------------------------------------------------
!
! global control parameters for program running
!
integer :: nplot ! every nplot # of marchings the plot files are generated
integer :: nsave ! every nsave # of iterations the restart file is generated
integer :: Probe_step ! every probe_step # of iterations save probe data
integer :: irerun ! =0, run from initial flowfiled; =1, read rerun file
!
! Geometry mode:
PMBFS2 User’s Manual 95

## 페이지 105
11.2. Data Structure
!
integer :: idim3d ! = 1, 1D; = 2, 2D; = 3, 3D
! (x - streamwise, y - vertical, z - spanwise)
integer :: iplane ! = 0, axisymmetric; = 1, 2d-planner; = 2, 3d-2pi grid
! this value is determined in Subroutine Metric
integer :: isweep(3)
!
! Flow-field mode:
!
integer :: ireal ! =0, run ideal gas; =1, real fluid
integer :: ivisc ! =0, inviscid flow; =1, viscous flow
integer :: igas ! =0, incompressible; =1, calorically perfect gas
! =2, calorically perfect; =3, thermally perfect;
! =4, CHEMKIN lib
integer :: ivisclaw ! =0, constant viscosity; =1, Sutherland law
integer :: icondlaw ! =0, Prandtl approx. law; =1, Wilke rule(igas>2)
integer :: idifflaw ! =0, Schmidt approx. law; =1, Chapman-Enskog rule(igas>2)
!
! Turbulence mode:
!
integer :: iturb ! =0, laminar flow; >=1, turblent flow
integer :: iwallfn
!
! Reactions mode:
!
integer :: ichem ! =0, non-reacting; = 1, reacting flows
integer :: irsolve ! =0, explicit; =1, implicit; =2, stiff; =3, splitting
integer :: iradapt ! =0, uniform reaction mechanism; =1, adaptive mechanism
integer :: ignit ! =0, no ignition source; =1, put in ignition source
!
! Two-phase mode:
!
integer :: ispray ! =0,only gas-phase; =1,two-phase flow
!
! Temporal-accuracy mode:
!
integer :: iunst ! =0, run steady; =1, unsteady
integer :: idual
integer :: isolve ! =1, Runge-Kutta; =2, Diag-ADI; =3, LU-SSOR
integer :: irktype ! =1, TVD 3-stage R-K, =2: Jameson 4-stage R-K
integer :: irkstep ! # of time steps for Runge-Kutta integration
integer :: itimlvl ! # of time levels for implicit unsteady integration
integer :: ismooth ! =0, no smooth; =1, implicit residual smoothing
integer :: nstep ! Runge-Kutta step variable in program
96 PMBFS2 User’s Manual

## 페이지 106
Chapter 11. Software Framework: Design, Structure and Implementation
!
! Spatial-accuracy mode:
!
integer :: iupwd !*Spatial discretization scheme types
! =0, central scheme;
! =1, upwind scheme (2nd or 3rd MUSCL Roe, 5th WENO)
integer :: iorder !*Spatial accuracy
! =1, 2nd-order ; =2, 4th-order accuracy in space
integer :: idiss !*Dissipation for central scheme
! =0, scalar dissipation; =1, TVD scalar dissipation
! =2, matrix dissipation
integer :: itvd !*Limiters for upwind scheme
! =0, no TVD limitor; =1, minmod limitor
!
! Preconditioning mode:
!
integer :: ipcon ! =0, no preconditioning; =1, preconditioning
integer :: ipltavg
integer :: iperturb
integer :: iavg
integer :: iavg_count
integer :: ireaverage
integer :: ibcmoc
integer :: imonitor
integer,save :: Debug ! control output level
logical :: PRECONDITIONING ! Preconditioning / Runge-Kutta
logical :: UNSTEADY ! UNSTEADY simulation or steady
logical :: Runge_Kutta ! Runge_Kutta schemes
logical :: Adam_Bashforth ! Adam_Bashforth scheme
logical :: Multi_Step_RK ! Original Runge_Kutta schemes
logical,save :: specify_inlet_profile ! if/not specify inlet flow profile!
!
! Initialization mode:
!
integer :: ini_udf ! =0, no UDF; =1 user defined initialization
integer :: initial_file ! select different initial files/methods
integer :: inlet ! specify inlet flow profile if inlet = 1
!
! program run mode:
!
integer :: nrt ! counter for physical time marching
integer :: npt ! counter for pseudo time marching
integer :: nrtmax ! max # of physical time marching
integer :: nptmax ! max # of pseudo time marching
integer :: itertot ! Total iteration #
integer :: iter_rt ! total iteration # for physical time
logical :: imainstop ! flag to stop physical time marching
real(precision) :: cfl ! CFL no.
PMBFS2 User’s Manual 97

## 페이지 107
11.2. Data Structure
real(precision) :: dtstep ! delta t for physical time marching
real(precision) :: zendtime ! max physical time marching
real(precision) :: time ! physical time
integer :: ierror ! error flag for the whole program
!
! Postprocessing mode:
!
!
! input configuration on grid
!
character(len=30) :: igrid_gridfile, &
igrid_connfile
real(precision) :: igrid_xscale, igrid_yscale, igrid_zscale
!----------------------------------------------------------------------
! Part III: Grid related variables in the program
!----------------------------------------------------------------------
!
! values depends on grid
!
integer :: nblock ! actual number of block in the problem
integer :: ncell_total ! actual number of cells
integer :: nnode_total ! actual number of nodes/grids
integer :: nghost ! number of ghost cells
integer :: icelltot_intr ! total number of interior cells without ghost cells)
! corresponding array: ip_cell(:)
integer :: ist_node, jst_node, kst_node
! starting index for grid point in i, j, k directions
integer :: ist_cell, jst_cell, kst_cell
! starting index for cell in i, j, k directions
!
! integer arrays: grid related
!
integer, dimension(nblk_max) :: mil,mjl,mkl
! number of grid nodes in xi,eta,zeta-direction
! which is the original number without ghost boundary
! Note: grid points [0,mil+1]x[0,mjl+1]x[0,mkl+1]
integer, dimension(nblk_max) :: imaxbl,jmaxbl,kmaxbl
! number of cells in xi,eta,zeta-direction with ghost
! 0, mil(nblk)+2 for second order central scheme
! -2, mil(nblk)+4 for fourth order central scheme
integer, dimension(nblk_max) :: stindx_node
! starting index for each block based on grid
! (original nodes plus 2 nodes in every direction)
integer, dimension(nblk_max) :: stindx_cell
! starting index for each block based on cell
! (total cells including ghost cells)
98 PMBFS2 User’s Manual

## 페이지 108
Chapter 11. Software Framework: Design, Structure and Implementation
integer, dimension(ncell) :: ip_cell
! pointer to internal cells only
! map from internal (2,mil(:); 2,mjl(:); 2,mkl(:);)
! to global cells (1:ncell_total)
integer, dimension(ncell) :: cell_type
! location of cell, internal, boundary, or ghost
logical, allocatable, dimension(:) :: Pro_Set
! type array for primitive/conservation translation
integer, dimension(5,6,nblk_max):: ibccnt
! block connection
integer, dimension(nblk_max,6) :: ibctype
! boundary condition:connection, physical
integer, dimension(nblk_max,6) :: location_shift
integer, dimension(nblk_max,6) :: ip_st ! start points of blocks
integer, dimension(ncell_bc,6) :: ipb !
! temperory array converting 1-D to 3D indices for cells and nodes.
! map the local location (:,:,:) to the global location in total array
integer, allocatable, dimension(:,:,:) :: block_ip, block_node_ip !
! for parallel commnication
integer, dimension(ncell) :: ipindx_snd, ipindx_rcv
!
! Reference values in program
!
real(precision) :: rugas ! Universal Gas constant
real(precision) :: zrgasinf ! initial gas constant for perfect gas
real(precision) :: zgamminf ! initial gamma for perfect gas
real(precision) :: zdensinf ! reference density for incompressible flow
real(precision) :: zviscinf ! reference viscocity
real(precision) :: zvsctref ! reference temperature in sutherland law
real(precision) :: zvsctsth ! reference constant in sutherland law
real(precision) :: rgas_ideal ! Gas constant for perfect gas
real(precision) :: gm_ideal ! gamma for perfect gas
real(precision) :: zPr ! laminar Prandtl number
real(precision) :: zSc ! laminar Schmidt number
real(precision) :: zPrt ! turbulent Prandtl number
real(precision) :: zSct ! turbulent Schmidt number
real(precision) :: ztb_tmscl ! turbulent time-step scale
real(precision) :: vnn ! von Neumann no.
real(precision) :: p0 ! free stream initial pressure
real(precision) :: t0 ! free stream initial temperature
real(precision) :: u0 ! free stream initial velocity
real(precision) :: zuxinf ! free stream initial x-velocity
real(precision) :: zuyinf ! free stream initial y-velocity
real(precision) :: zuzinf ! free stream initial z-velocity
real(precision) :: zysinf(nspe) ! free stream multi-species
PMBFS2 User’s Manual 99

## 페이지 109
11.2. Data Structure
real(precision) :: pref ! reference pressure
real(precision) :: uref ! reference velocity
real(precision) :: tref ! reference temperature
!*Flow quantities for boundary
real(precision) :: zpback ! back pressure for subsonic outflow
real(precision) :: zptotinf ! total pressure for subsonic inflow
real(precision) :: zttotinf ! total temperature for subsonic inflow
!*Free stream quantities
real(precision) :: ztkeinf ! turbulent kinetic energy
real(precision) :: zepsinf ! dissipation rate
real(precision) :: zomginf ! Wilcox’s omega variable (~epsilon/k)
real(precision) :: zvnuinf ! S-A kinematic eddy viscosity
real(precision) :: rm1 !
real(precision) :: rm2 !
real(precision) :: eps2 ! coefficient for artificial viscosity
real(precision) :: eps4 ! coefficient for artificial viscosity
real(precision) :: eps6 ! coefficient for artificial viscosity
real(precision) :: eps_res ! coefficient for residual smoothing
real(precision) :: ressum ! total residua
real(precision) :: dqerr
real(precision) :: adt1
real(precision) :: adt2
real(precision) :: adt3
real(precision) :: adt4
real(precision) :: clength_x
real(precision) :: clength_y
real(precision) :: clength_z
real(precision) :: comm_time
real(precision) :: C_R, C_I ! empirical constants for SGS modeling
real(precision) :: avg_time
!
! real arrays, grid dependent
!
real(precision), dimension(ncell),save :: x, y, z !, xc, yc, zc
real(precision), dimension(3,ncell),save:: x_cen ! coord. of center of cell
real(precision), dimension(ncell,3),save:: mtrfx, mtrfy, mtrfz
! "area projection" in (x,y,z) direction
! S_{\xi,x}, S_{\xi,y}, S_{\xi,z}
! S_{\eta,x}, S_{\eta,y}, S_{\eta,z}
! S_{\zeta,x}, S_{\zeta,y},S_{\zeta,z}
real(precision), dimension(ncell,3),save:: mtrcx, & ! metric terms
mtrcy, & ! at cell center
mtrcz
real(precision), dimension(ncell,3),save:: vsx, vsy, vsz, &
vex, vey, vez, &
vzx, vzy, vzz
! viscous metric terms evaluation
real(precision), dimension(ncell),save:: cls, & !cell length in xi-direction
100 PMBFS2 User’s Manual

## 페이지 110
Chapter 11. Software Framework: Design, Structure and Implementation
cle, & !cell length in eta-direction
clz !cell length in zeta-direction
real(precision), dimension(ncell),save:: vol !cell volume
real(precision), dimension(ncell),save:: Delta_bar
real(precision), dimension(ndim_max,ndim_max,nblk_max) :: cost, sint
!----------------------------------------------------------------------
! Part IV: Physical variables and arrays in the program
!----------------------------------------------------------------------
real(precision), dimension(ncell) :: dtau ! timestep in each cell
real(precision), dimension(ncell) :: beta, epsi ! preconditioning factor
real(precision), dimension(ncell,num_flow_eqns) :: q ! only flow variable
real(precision), dimension(ncell,neq) :: qold ! save n step values
real(precision), dimension(ncell) :: rho, p, c, hs, ht !by Jian
real(precision), dimension(ncell) :: radi, radj, radk
real(precision), dimension(ncell,neq) :: dq
real(precision), dimension(ncell,neq) :: source ! source terms
! modified by Shanwu Wang for extremly complex configuration/block for MOC BC
real(precision), dimension(ncell,neq) :: dqsai
real(precision), dimension(ncell,neq) :: qavg, qrms
real(precision), dimension(ncell),save :: rgas, wmm, cp, cv, gamma
! thermal properites
! mdj one of rgas &
! wmm is redundant!
real(precision), dimension(ncell),save :: visc, cond ! transpotation properties
real(precision), dimension(ncell),save :: emut, emueff, coneff
real(precision), dimension(5),save :: alpha ! coefficients of RK marching
#ifdef DUALTIME
real(precision), dimension(ncell,neq) :: qn, qnm1, qnm2
#endif
!------------------------------------------------------------------
! for reaction case
! (comment out the macro defination with nspe=0)
!
! zsp*** : variables for specie constant
!------------------------------------------------------------------
character(len=16) :: ispname(nspe)
real(precision), dimension(nspe) :: zspgam, zspcp, zspwm
real(precision), dimension(nspe) :: cp0, cp1, cp2, cp3, cp4
real(precision), dimension(nspe) :: cd0, cd1, cd2, cd3, cd4, &
eu0, eu1, eu2, eu3, eu4, &
zsphref
PMBFS2 User’s Manual 101

## 페이지 111
11.2. Data Structure
real(precision), dimension(nspe) :: zspvisc0, zspvsct0, zspvscts, &
zspcond0, zspcndt0, zspcndts
! multi-species parameters for Sutherland law
real(precision), dimension(nspe,nspe) :: teab, dcoef, pha, phb
real(precision) :: zsparks
#ifdef SPECIES
real(precision), dimension(ncell,nspe) :: ys
real(precision), dimension(ncell,nspe) :: hh
real(precision), dimension(ncell,nsm) :: dhh
real(precision), dimension(ncell,nsm,neq) :: tsour
! Jacobian of chemical source terms
#ifdef CUBICEOS
real(precision), dimension(ncell,nspe) :: ayi
real(precision), dimension(ncell) :: aar, aat
#else
real(precision), dimension(ncell,nsm) :: omega
#endif
#ifdef FLAMELET
real(precision), dimension(ncell,num_pass_eqns) :: zs
! passive scalar variable
real(precision), dimension(ncell,num_pass_eqns,nspe) :: dyidzs
real(precision), dimension(51,51,nspe) :: yslib, dydzlib
! Flamelet chemistry library
#else
real(precision), dimension(ncell,nspe) :: diff, deff
! laminar and effective mass diffusivity
! used in species equation
#endif
! Initial and boundary conditions for multi-species
!real(precision), dimension(nspe) :: zysinf
#ifdef FLAMELET
real(precision), dimension(num_pass_eqns) :: zzsinf
#endif
#endif
character(len=3) :: file_suffix ! suffix for different processes
!------------------------------------------------------------------
! for turbulence modeling case
!------------------------------------------------------------------
real(precision), dimension(ncell) :: tke
!#ifdef TURBRANS
real(precision), allocatable, dimension(:,:) :: tb
102 PMBFS2 User’s Manual

## 페이지 112
Chapter 11. Software Framework: Design, Structure and Implementation
real(precision), allocatable, dimension(:,:) :: zsrc_turb, &
emuteff
! zsrc_turb : source terms of turbulent models
! emuteff : effective turbulent viscosity
real(precision), allocatable, dimension(:) :: wdist
! wdist : Distance of each cell centers to the nearest no-slip wall
!
! Data module of Spalart-Allmaras model
!
type t_turbCoef_spalart
integer :: idamp ! damping function model
end type t_turbCoef_spalart
type(t_turbCoef_spalart) :: turbsa
!
! Data module of k-epsilon type models
!
type t_turbCoef_kepsln
integer :: idamp ! damping function model
integer :: iepseq ! enhanced damping function model
integer :: icomp ! compressible dissipation model
integer :: ipdil ! pressure-dilatation model
real(precision) :: cmu
real(precision) :: sgmk, sgmt2
real(precision) :: ceps1, ceps2
real(precision) :: prdlim ! production limiter
real(precision) :: alf1 ! compressible dissipation parameter
real(precision) :: alf2, alf3 ! pressure-dilatation parameter
end type t_turbCoef_kepsln
type(t_turbCoef_kepsln) :: turbke
!
! Data module of k-omega type models
!
type t_turbCoef_komega
real(precision) :: btastr ! =0.09 for SST and standard k-w
real(precision) :: kapa ! =0.41 for SST and standard k-w
real(precision) :: a1 ! =0.31 for SST
! Constants of Set 1 (SST inner)
real(precision) :: sgmk1 ! =0.85 for SST and 0.5 for standard
real(precision) :: sgmw1 ! =0.5 for SST and 0.5 for standard
real(precision) :: bta1 ! =0.075 for SST and standard k-w
real(precision) :: alp1
! Constants of Set 2 (standard k-e)
real(precision) :: sgmk2 ! =1.
real(precision) :: sgmw2 ! =0.856
real(precision) :: bta2 ! =0.0828
real(precision) :: alp2
PMBFS2 User’s Manual 103

## 페이지 113
11.2. Data Structure
real(precision) :: bkw ! wall param
end type t_turbCoef_komega
type(t_turbCoef_komega) :: turbkw
!
! Additional arrays for Mentor’s turbulent k-omega SST model
!
real(precision), allocatable, dimension(:) :: sgmk, sgmw
!#endif
END MODULE pmbfs_data
104 PMBFS2 User’s Manual

## 페이지 114
Chapter 11. Software Framework: Design, Structure and Implementation
11.2.1.4 Data module for spray model
!======================================================================
! module 1: for constants in this module
!======================================================================
module spray_constant
implicit none
integer, parameter :: dk = selected_real_kind(6) ! single precision
integer, parameter :: double_precision = selected_real_kind(14)! dou. pre.
integer, parameter :: Parcel_Max = 30000 ! max parcel number/CPU
integer, parameter :: Max_Dim= 3 ! dimension (3D or 2D)
integer, parameter,private :: dp = double_precision ! data precision for
! internal parameter
real(dp), parameter :: pi = 3.1415926535897932384626433832795_dp
real(dp), parameter :: pi_2 =pi/2.0_dp, pi_8=pi/8.0_dp, pi_6=pi/6.0_dp, &
pi_12=pi/12.0_dp, pi_4_3 = pi*4.0_dp/3.0_dp, &
double_pi = 2 * pi
!
! identify spray state
!
integer, parameter :: &
Spray_Evaporated = 10000, & ! Evaporating completely
Spray_Inside_Exchange = 10001, & ! crosses interface of internal blocks
Spray_Flow_Out = 10002, & ! flow out
Spray_Wall = 10003, & ! hit wall
Spray_NULL = 11111, & ! NULL, remove
Spray_Normal = 0, & ! normal spray
IJK_Reset = 0 ! scan the location of parcel
end module spray_constant
!======================================================================
! module 2: for spray data structure
!======================================================================
module spray_data_structure
use spray_constant
implicit none
type spray_block
integer :: head,tail ! head and tail
integer :: num ! total number = tail - head + 1
end type spray_block
!----------------------------------------------------------------------
!: CAUTION: the following two types must be consistent with the subroutine
!: SPRAY_MPI_DERIVATION()
!:
! droplet
!
type droplet
real(dk) :: x(Max_Dim)! coordinate
real(dk) :: u(Max_Dim)! velocity
real(dk) :: d ! dimeter
real(dk) :: t ! temperature
PMBFS2 User’s Manual 105

## 페이지 115
11.2. Data Structure
end type droplet
!
! parcel
!
type parcel
integer :: node ! parcel location: node in multi-block
integer :: i ! parcel location: index
integer :: state ! parcel state
real(dk) :: n ! droplet number, can be real for breakup
real(dk) :: n0 ! droplet initial diameter(for breakup model)
type(droplet) :: drop ! droplet properties, uniform assumption
end type parcel
!----------------------------------------------------------------------
!
! statistics variables in each node/cell of grid (in Eulerian Coordinates.)
!
type spray_statistic_data
real(double_precision) :: n ! sum of particle number
real(double_precision) :: d ! sum of diameter
real(double_precision) :: d2 ! sum of diameter^2
real(double_precision) :: d3 ! sum of diameter^3
real(double_precision) :: u(Max_Dim) ! sum of droplet velocity
real(double_precision) :: u2(Max_Dim) ! sum of droplet velocity ^2
real(double_precision) :: v(Max_Dim) ! sum of volume flux, L^3/s/L^2
end type spray_statistic_data
end module spray_data_structure
!======================================================================
! global varaibles and internal subroutines
!======================================================================
module spray_variables
use spray_data_structure
use pmbfs_mod
implicit none
!
! varaibles
!
type(parcel),save :: Par(Parcel_Max), & ! Total parcel stack
bufPar(Parcel_Max) ! buffer parcel array
!
! two variables for spray statistics
!
type(spray_statistic_data),save :: cell_stat(ncell) !
real(double_precision),save :: Spray_Mean_Time = 0.0_double_precision
type(spray_block), save:: drop_block(nblk_max)
type(spray_block), save:: spray_send(MAX_SNDRCV_PROC)
integer, save :: ip_spray_send(Parcel_Max / 2)
integer,save :: Total_Spray_Num = 0
real(dk),save :: zdp_MinDropDiam = 0.5E-6 ! spray minimum diameter
real(dk),save :: zdp_MinBreakDiam = 20.E-6 ! breakup minimum diameter
106 PMBFS2 User’s Manual

## 페이지 116
Chapter 11. Software Framework: Design, Structure and Implementation
!
! private data
!
integer, private :: iiiii
integer, private, save :: stack(Parcel_Max)=(/(iiiii, iiiii=1,Parcel_Max)/)
! stack for free parcels
integer, private, save :: pos = 1 ! position of first free parcel id
integer, save :: test_num
integer, save :: Two_Phase = 0 ! two phase calculation switch
! 0. Single carrier phase
! 1. One-way coupling
! 2. Two-Way coupling
integer, save :: Particle_Only=0 ! 1. Don’t calculate carrier phase
integer, save :: Breakup_Model=1 ! breakup model switch
! 0. No breakup
! 1. Wave mode Breakup (Reitz 1987)
integer, save :: idpWallModel = 2 ! droplet/wall interaction model
! 0. Nothing
! 1. Simple evaporation model
! 2. Mundo model (Mundo 1995)
end module spray_variables
!======================================================================
! subroutines & functions which are related with spray
! but are independ of physics
!======================================================================
module spray_mod
use spray_variables
implicit none
integer, parameter, private :: search_down_range = -1, search_up_range = 3
type neighbour
integer :: m((search_up_range-search_down_range+1)**Max_dim)
end type
type(neighbour), private, save :: offset(nblk_max,0:1,0:1,0:1)
logical, private, save :: offset_settle = .false.
logical, private, save :: Parcel_Reset = .false.
end module spray_mod
!===============================================================================
! Module spray_physics
!
! Description:
! Module for two-phase flow, physics properties and interactions
!
! History:
! Version Date Comment
! ------- ---- -------
! 1.0.0 09/27/01 simple one-way coupling. Shanwu Wang
! 1.1.0 09/16/02 One-Way Coupling, mass and energy transfer. Shanwu Wang
PMBFS2 User’s Manual 107

## 페이지 117
11.2. Data Structure
! 2.0.0 11/06/08 Two-way coupling, multi-species evaporation. Dongjun Ma
!===+====1====+====2====+====3====+====4====+====5====+====6====+====7====+====8
module spray_physics
use spray_mod
implicit none
real(dk) :: dt_p, TimeInc, CarrierPhaseTimeStep
! carrier phase propeties
real(dk),private :: rho_c, visc_c, k_c, Ya_c, T_c !
! droplet/particle properties
real(dk),private :: m_p, D_p, d2, T_p, & ! mass, dia, dia^2, and temp.
Red, sqrt_Red, cd, & ! droplet Re, sqrt(Re),drag coef
du,N_p ! |u|, parcel number
! first order derivation of droplet property
real(dk),private :: mp_dot, dDpdt, dTpdt, q_dot
!
! droplet intrinsic properties (independ of velocity and size)
!
real(dk),private,save :: T_ref,P_ref,Bvap, &! reference temperature, pressure,
wm_p, & ! weight of drop molecular,kg/kmol
c_p, & ! specific heat capacity, J/kg/K
rho_p, & ! density, kg/m^3
sigma, & ! surface tension, kg/s^2 or N/m
visc_p,& ! viscosity, N s/m^2
h_fg, & ! latent heat of vaporization,J/kg
h_fs !
real(dk),private,save :: t_cri, p_cri, vp1, vp2, vp3, vp4
real(dk),private :: sst(neq) ! Spray Source Term
real(dk),private :: Ds,Pr,Sc,Sh,Le,Nu,Ya_sur, By, Ma, Mm, Pv_sur, P_c
integer,private :: ijk ! the location of spray
! gravity acceleration
real(dk),private,parameter :: g(Max_Dim) = (/0.0,-9.8,0.0/)
real(dk),dimension(Max_Dim),private :: du_v,u_c, dudt,f_p,u_p, x_p,x_p0
real(dk),private :: absU_inj
real,save :: spray_smooth_factor = 0.0
!--------------------------------------------------------------------
! parameters for injection and breakup
!
108 PMBFS2 User’s Manual

## 페이지 118
Chapter 11. Software Framework: Design, Structure and Implementation
! velocity, location, and temperature
!
real(dk),save :: U_inj(Max_Dim), & ! injection velocity
T_inj, & ! liquid temperature
x_inj(Max_Dim), & ! injector location
D_inj = 250.0E-6_dk, & ! injector diameter
phi_inj = 0.0_dk, & ! injection angle
accumulation_speed=1, & ! accumulation speed.1=normal
mean_vol =1.0E-15 ! mean volume in each parcel
! constants in breakup model, from Reitz’s paper (1987)
real(dk),save :: B0 = 0.61, B1 = 10, A1 = 0.188
integer,save :: Block_inj=1, & ! CPU number of injector
LIQUID=0 ! Liquid properties
END MODULE spray_physics
11.2.2 Description of Data Structure
• All of the flow variables, coordinates, metric terms, etc., are stored in 1d arrays, e.g.,
u(ijk)
• The 1d arrays are organized by blocks: the unknowns of the first block are stored at the
beginning of the array, followed by those of second block, and so on.
• Thepositionofthefirstentryforeachblockiscalculatedaccordingtothenumberofblocks
and is stored in an integer array.
u(ijk)
ijk = stindx_cell(nblk)
+ (iend - istart + 1) * (jend - jstart + 1) * (k - kstart)
+ (iend - istart + 1) * (j - jstart)
+ (i - istart + 1)
• Each face has a pointer array for block interface to store the array index of the neighboring
block e.g., ipbw(:), ipber(:), etc.
• Pointer arrays for block interfaces are handled differently for parallel processing.
– determinetheprocessor#thatthecurrentprocessorwillsendmessagestoandreceive
messages from.
my_sndto_proc(:) <= proc #
my_rcvfrom_proc(:) <= proc #
– determine the SendTo pointer.
∗ store the F.V. cell index the block boundaries that the current processor will
need to send messages to processor n into a pointer array ipindx_snd(:)
∗ information that is required to determine the cell index:
isnd_face_blk(:)%blknum <= block #
isnd_face_blk(:)%face <= block #
PMBFS2 User’s Manual 109

## 페이지 119
11.2. Data Structure
the current processor will send messages to processor n’s which block and which
face
– determine the RecvFrom pointer
∗ Obtain information regarding the block # and face # the current processor will
receive messages
ircv_face_block(:)%blknum <= block#
ircv_face_block(:)%face <= face#
∗ store the F.V. cell index the block boundaries that the received messages will be
put into.
• Each block has # of ghost cells in W.E.S.N.B. and T faces
for 2nd-order: 2 ghost cells
for 4th-order: 4 ghost cells
istart=0, jstart=0, kstart=0,
iend=imaxbl(nblk), jend=jmaxbl(:), kend=kmaxbl(:)
for 2nd-order scheme:
for 4th-order scheme:
istart= 2, jstart= 2, kstart= 2
Cell indices boundaries for B.C.’s calculations are calculated at the beginning and store in
different dynamic arrays. Each pointer array collects all the F.V. indices with same kind
of B.C.s. e.g., ip1(:) store all the indices with ibctype=1.
• Although in-viscid and viscous fluxes and artificial dissipation need to be calculated in
all three (i.e., i, j, k) directions, the subroutines that calculate those are written in one
direction only. The calculations for all three directions are accomplished by calling the
same subroutines with different order of F.V. cell indices. It is ip(:) array that controls
i or j or k sweeping.
! for i-sweeping
do k = kst, kend
do j = jst, jend
do i = ist, iend
id = id + 1
ip(id) = (k - kst) * (jend - jst + 1) * (iend - ist + 1)
+(j - jst) * (iend - ist + 1)
+ i - ist + 1
end do
end do
end do
!for j-sweeping
do i = ist, iend
do k = kst, kend
do j = jst, jend
ip(id) = ...
110 PMBFS2 User’s Manual

## 페이지 120
Chapter 11. Software Framework: Design, Structure and Implementation
end do
end do
end do
!for k-sweeping
do j = jst, jend
do i = ist, iend
do k = kst, kend
ip(id) = ...
end do
end do
end do
PMBFS2 User’s Manual 111

## 페이지 121
11.3. Program Structure
11.3 Program Structure
The structured of the research code is shown in the following table
Table 11.1: Code structure of PMBFS2
1. Start
2. Input
Read input parameters
3. Initialize
Read in mesh
Calculate block boundary pointer
Calculate metric terms
Initialize thermodynamic properties
Initialize flow-field
4. Time-marching loop
Calculate time step
Liquid phase (spray) solver
Re-organize the spray array
Injection of dispersed phase
Secondary breakup treatment
Two-way coupling calculation
Re-localization of droplets
Gas phase solver
Right-hand-side calculation
Inviscid fluxs
Viscous fluxs
Artifical dissipation
Boundary conditions
Update variables
Calculate residuals
Output data
5. Repeat step 4 if necessary
6. Stop
11.3.1 Flow Chart
11.3.1.1 Main Program
The flow chart of the main program is shown in the figure 11.2.
11.3.1.2 Main Solver
The flow chart of the main solver is shown in the figure 11.3.
112 PMBFS2 User’s Manual

## 페이지 122
Chapter 11. Software Framework: Design, Structure and Implementation
PROPIN
Start
initialize thermodynamic properties
INPUT
MESH
read in data & control parameters
read in mesh
INITIA
LINKB
initialization
calculate block boundary pointer
numprocs >1
Yes
Time-Marching Loop No LINKB_PAR
calculate block boundary pointer for parallel processing
TIMESTEP
METRIC and METRIC_G
calculate timestep
calculate metric terms, cell volume
SOLVE
INIT
main solver
initialize flowfield
=1
RESIDUAL RESTART
Rerun
calculate residual reading rerun data
=0
PLOT TRANSP
output data for plotting purpose transport properties
STORE BC
output data for rerun purpose boundary conditions
No
BLOCK_BC
nt > ntmax
updata data @ block boundaries
Yes
Return
STOP
numprocs>1
Yes
PARUPDATE
update data @ block boundaries
related to parallel processing
Figure 11.2: Flow chart of main program PMBFS2.
PMBFS2 User’s Manual 113

## 페이지 123
11.3. Program Structure
SOLVE FOUR STEP R-K
main solver
TRANSP
RHS
right-hand-side calculation
CFLUX_S
convective fluxes calculations UPDATE VARIBLES
ADDVIS BLOCK_BC
artificial dissipation calculationr
PARUPDATE
VFLUX YES
viscous fluxes calculations
RE-initialization of
NO
G Equation
EOS
update temperature etc.
RETURN
BC
nstep > irk
RETURN
Figure 11.3: Flow chart of main solver solve.
114 PMBFS2 User’s Manual

## 페이지 124
Chapter 11. Software Framework: Design, Structure and Implementation
11.3.2 Subroutines
11.3.2.1 addvis_s
Name: addvis_s
Description: Subroutine to calculate Artificial Dissipation (AD) for central scheme’s scalar
dissipation model without discontinuities treatment.
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:86)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:90)
(cid:85)(cid:75)(cid:86) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
11.3.2.2 addvis_stvd
Name: addvis_stvd
Description: Subroutine to calculate Artificial Dissipation (AD) for central scheme’s scalar
dissipation model with TVD discontinuities treatment.
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:90)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:72)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:86)(cid:87)(cid:89)(cid:71)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:85)(cid:75)(cid:86) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:71)(cid:80)(cid:68)(cid:91)(cid:20)
11.3.2.3 addvis_m
Name: addvis_m
Description: Subroutine to calculate Artificial Dissipation (AD) for central scheme’s matrix
dissipation model without discontinuities treatment.
PMBFS2 User’s Manual 115

## 페이지 125
11.3. Program Structure
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:80)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:90)
(cid:85)(cid:75)(cid:86) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
11.3.2.4 bc
Name: bc
Description: Subroutine for boundary conditions.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:69)(cid:70)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:69)(cid:76)(cid:81)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:83)(cid:76)(cid:81)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:69)(cid:82)(cid:88)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:69)(cid:76)(cid:81)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:83)(cid:82)(cid:88)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:83)(cid:76)(cid:81)
(cid:69)(cid:70)(cid:66)(cid:76)(cid:81)(cid:89)(cid:90)(cid:68)(cid:79)(cid:79)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:69)(cid:82)(cid:88)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:89)(cid:76)(cid:86)(cid:90)(cid:68)(cid:79)(cid:79)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:88)(cid:83)(cid:82)(cid:88)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:89)(cid:76)(cid:86)(cid:90)(cid:68)(cid:79)(cid:79)(cid:73)(cid:88)(cid:81)(cid:70)
(cid:69)(cid:70)(cid:66)(cid:76)(cid:81)(cid:89)(cid:90)(cid:68)(cid:79)(cid:79)
(cid:69)(cid:70)(cid:66)(cid:73)(cid:68)(cid:85)(cid:73)(cid:76)(cid:72)(cid:79)(cid:71)
(cid:69)(cid:70)(cid:66)(cid:89)(cid:76)(cid:86)(cid:90)(cid:68)(cid:79)(cid:79)
(cid:69)(cid:70)(cid:66)(cid:83)(cid:72)(cid:85)(cid:76)(cid:82)(cid:71)(cid:76)(cid:70)
(cid:69)(cid:70)(cid:66)(cid:83)(cid:72)(cid:85)(cid:76)(cid:82)(cid:71)(cid:76)(cid:70)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:76)(cid:81)(cid:74)(cid:88)(cid:79)(cid:68)(cid:85)
(cid:69)(cid:70)(cid:66)(cid:86)(cid:76)(cid:81)(cid:74)(cid:88)(cid:79)(cid:68)(cid:85)
(cid:69)(cid:70)(cid:66)(cid:72)(cid:81)(cid:87)(cid:85)(cid:68)(cid:76)(cid:81)(cid:80)(cid:72)(cid:81)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:72)(cid:81)(cid:87)(cid:85)(cid:68)(cid:76)(cid:81)(cid:80)(cid:72)(cid:81)(cid:87)
(cid:69)(cid:70)(cid:66)(cid:74)(cid:72)(cid:87)(cid:66)(cid:71)(cid:76)(cid:85)(cid:57)(cid:72)(cid:70)(cid:87)(cid:82)(cid:85)
(cid:69)(cid:70)(cid:66)(cid:89)(cid:76)(cid:86)(cid:90)(cid:68)(cid:79)(cid:79)(cid:73)(cid:88)(cid:81)(cid:70)
(cid:88)(cid:89)(cid:90)(cid:66)(cid:90)(cid:68)(cid:79)(cid:79)
(cid:69)(cid:70)(cid:66)(cid:73)(cid:68)(cid:85)(cid:73)(cid:76)(cid:72)(cid:79)(cid:71)
Contains:
bc_subin Subroutine to do subsonic inflow boundary condition,
bc_supin Subroutine to do supersonic inflow boundary condition,
bc_subout Subroutine to do subsonic outflow boundary condition,
bc_supout Subroutine to do supersonic outflow boundary condition,
bc_invwall Subroutine to do inviscid wall boundary condition,
bc_viswall Subroutine to do viscous wall boundary condition,
bc_viswallfunc Subroutine to do turbulent wall function boundary condition,
bc_farfield Subroutine to do far field boundary condition,
bc_periodic Subroutine to do periodic boundary condition,
bc_singular Subroutine to do singular boundary condition,
116 PMBFS2 User’s Manual

## 페이지 126
Chapter 11. Software Framework: Design, Structure and Implementation
11.3.2.5 bc_moc
Name: bc_moc
Description: Subroutine for boundary conditions using method of characteristics.
11.3.2.6 bc_block
Name: bc_block
Description: Subroutine to update variables at block boundaries
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:69)(cid:70)(cid:66)(cid:69)(cid:79)(cid:82)(cid:70)(cid:78)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85)
11.3.2.7 bc_parallel
Name: bc_parallel
Description: Subroutine to update variables at block boundaries in parallel processing mode.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:69)(cid:70)(cid:66)(cid:83)(cid:68)(cid:85)(cid:68)(cid:79)(cid:79)(cid:72)(cid:79)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85) (cid:48)(cid:51)(cid:44)(cid:66)(cid:58)(cid:55)(cid:44)(cid:48)(cid:40)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:44)(cid:53)(cid:40)(cid:38)(cid:57)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:44)(cid:54)(cid:40)(cid:49)(cid:39)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:58)(cid:36)(cid:44)(cid:55)(cid:36)(cid:47)(cid:47)
11.3.2.8 cflux_central
Name: cflux_central
Description: Subroutine to calculate convective flux using central scheme.
11.3.2.9 cflux_upwind
Name: cflux_upwind
Description: Subroutine to calculate convective flux using upwind scheme.
PMBFS2 User’s Manual 117

## 페이지 127
11.3. Program Structure
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:68)(cid:76)(cid:70)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:68)(cid:76)(cid:70)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:68)(cid:76)(cid:70)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:90)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:72)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:81)(cid:69)(cid:79)(cid:78)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:70)(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:70)(cid:72)(cid:81)(cid:87)(cid:85)(cid:68)(cid:79)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:86)(cid:76)(cid:71)(cid:72)(cid:66)(cid:76)(cid:81)(cid:71)(cid:91)
(cid:85)(cid:75)(cid:86) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29) (cid:70)(cid:86)(cid:75)(cid:76)(cid:73)(cid:87)
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:90)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:69)(cid:70)(cid:72)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:70)(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:88)(cid:83)(cid:90)(cid:76)(cid:81)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:81)(cid:69)(cid:79)(cid:78)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:73)(cid:90)(cid:72)(cid:81)(cid:82)(cid:24)(cid:85)(cid:82)(cid:72)
(cid:85)(cid:75)(cid:86)
(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:88)(cid:83)(cid:90)(cid:76)(cid:81)(cid:71)(cid:66)(cid:69)(cid:82)(cid:88)(cid:81)(cid:71)(cid:86) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:73)(cid:90)(cid:72)(cid:81)(cid:82)(cid:24)(cid:85)(cid:82)(cid:72)
118 PMBFS2 User’s Manual

## 페이지 128
Chapter 11. Software Framework: Design, Structure and Implementation
11.3.2.10 chem_source
Name: chem_source
Description: Subroutine to calculate the explicit source terms of chemical reactions.
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:70)(cid:75)(cid:72)(cid:80)(cid:66)(cid:86)(cid:82)(cid:88)(cid:85)(cid:70)(cid:72)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:70)(cid:75)(cid:72)(cid:80)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:80)(cid:83)(cid:79)(cid:76)(cid:70)(cid:76)(cid:87)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:68)(cid:91)(cid:69)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
11.3.2.11 chem_solve_implicit
Name: chem_solve_implicit
Description: Subroutine to perform the point implicit solution method for stiff chemical
source terms.
11.3.2.12 chem_ignite
Name: chem_ignite
Description: Subroutine to deposit energy source(s) for fuel ignition.
11.3.2.13 eos
Name: eos
Description: Subroutine to update variables due to equation of state.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:72)(cid:82)(cid:86)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:85)(cid:72)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:77)(cid:78)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:73)(cid:79)(cid:82)(cid:90)(cid:73)(cid:76)(cid:72)(cid:79)(cid:71)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85)
11.3.2.14 init_flowfield
Name: init_flowfield
Description: Subroutine to initialize the flow fields.
PMBFS2 User’s Manual 119

## 페이지 129
11.3. Program Structure
11.3.2.15 init_solver
Name: init_solver
Description: Subroutine to initialize the flow solver: read input, configure flow solver, read
grid, setup geometry, initialize the flow fields.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:72)(cid:87)(cid:66)(cid:76)(cid:81)(cid:76)(cid:87)(cid:76)(cid:68)(cid:79)(cid:66)(cid:89)(cid:68)(cid:79)(cid:88)(cid:72)
(cid:51)(cid:48)(cid:37)(cid:41)(cid:54)(cid:21) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)(cid:17)(cid:74)(cid:72)(cid:87)(cid:66)(cid:76)(cid:81)(cid:83)(cid:88)(cid:87)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:70)(cid:82)(cid:81)(cid:73)(cid:76)(cid:74)
(cid:86)(cid:72)(cid:87)(cid:66)(cid:76)(cid:81)(cid:76)(cid:87)(cid:76)(cid:68)(cid:79)(cid:66)(cid:89)(cid:68)(cid:79)(cid:88)(cid:72)
(cid:79)(cid:76)(cid:81)(cid:78)(cid:69)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:70)(cid:82)(cid:81)(cid:73)(cid:76)(cid:74)
(cid:79)(cid:76)(cid:81)(cid:78)(cid:69)(cid:66)(cid:83)(cid:68)(cid:85)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)(cid:17)(cid:74)(cid:72)(cid:87)(cid:66)(cid:74)(cid:72)(cid:82)(cid:80)
(cid:79)(cid:76)(cid:81)(cid:78)(cid:66)(cid:83)(cid:72)(cid:85)(cid:76)(cid:82)(cid:71)(cid:73)(cid:76)(cid:91)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:80)(cid:72)(cid:80)(cid:66)(cid:71)(cid:72)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:80)(cid:72)(cid:80)(cid:66)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:86)(cid:72)(cid:87)(cid:66)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:87)(cid:92)(cid:83)(cid:72)(cid:66)(cid:68)(cid:81)(cid:71)(cid:66)
(cid:83)(cid:82)(cid:76)(cid:81)(cid:87)(cid:72)(cid:85)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)(cid:17)(cid:80)(cid:72)(cid:86)(cid:75)
(cid:79)(cid:76)(cid:81)(cid:78)(cid:69)
(cid:79)(cid:76)(cid:81)(cid:78)(cid:69)(cid:66)(cid:83)(cid:68)(cid:85)
(cid:80)(cid:72)(cid:87)(cid:85)(cid:76)(cid:70)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:90)(cid:71)(cid:76)(cid:86)(cid:87)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:73)(cid:79)(cid:82)(cid:90)(cid:73)(cid:76)(cid:72)(cid:79)(cid:71)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)(cid:17)(cid:85)(cid:72)(cid:85)(cid:88)(cid:81)(cid:66)(cid:76)(cid:82)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:83)(cid:72)(cid:85)(cid:87)(cid:88)(cid:85)(cid:69)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:86)(cid:74)(cid:86)
(cid:85)(cid:72)(cid:68)(cid:71)(cid:66)(cid:68)(cid:89)(cid:72)(cid:85)(cid:68)(cid:74)(cid:72)
(cid:68)(cid:89)(cid:72)(cid:85)(cid:68)(cid:74)(cid:72)
(cid:69)(cid:70)
(cid:69)(cid:70)(cid:66)(cid:69)(cid:79)(cid:82)(cid:70)(cid:78)
(cid:69)(cid:70)(cid:66)(cid:83)(cid:68)(cid:85)(cid:68)(cid:79)(cid:79)(cid:72)(cid:79)
(cid:72)(cid:82)(cid:86)
(cid:87)(cid:85)(cid:68)(cid:81)(cid:86)(cid:83)
11.3.2.16 lib
Name: lib
Description: Auxiliary subroutines.
11.3.2.17 main
Name: main
120 PMBFS2 User’s Manual

## 페이지 130
Chapter 11. Software Framework: Design, Structure and Implementation
Description: Main program for PMBFS2 code.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:48)(cid:68)(cid:76)(cid:81)(cid:3)(cid:51)(cid:85)(cid:82)(cid:74)(cid:85)(cid:68)(cid:80)(cid:3)(cid:51)(cid:48)(cid:37)(cid:41)(cid:54)(cid:21)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:83)(cid:68)(cid:85)(cid:68)(cid:79)(cid:79)(cid:72)(cid:79)(cid:66)(cid:76)(cid:81)(cid:76)(cid:87)(cid:76)(cid:68)(cid:79)(cid:76)(cid:93)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81) (cid:83)(cid:68)(cid:85)(cid:68)(cid:79)(cid:79)(cid:72)(cid:79)(cid:66)(cid:76)(cid:81)(cid:76)(cid:87)(cid:76)(cid:68)(cid:79)(cid:76)(cid:93)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)
(cid:80)(cid:72)(cid:68)(cid:86)(cid:88)(cid:85)(cid:72)(cid:66)(cid:70)(cid:83)(cid:88)(cid:66)(cid:87)(cid:76)(cid:80)(cid:72) (cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85)
(cid:39)(cid:76)(cid:86)(cid:83)(cid:79)(cid:68)(cid:92)(cid:43)(cid:72)(cid:68)(cid:71)(cid:76)(cid:81)(cid:74) (cid:39)(cid:76)(cid:86)(cid:83)(cid:79)(cid:68)(cid:92)(cid:43)(cid:72)(cid:68)(cid:71)(cid:76)(cid:81)(cid:74)
(cid:80)(cid:72)(cid:68)(cid:86)(cid:88)(cid:85)(cid:72)(cid:66)(cid:70)(cid:83)(cid:88)(cid:66)(cid:87)(cid:76)(cid:80)(cid:72)
(cid:88)(cid:83)(cid:71)(cid:68)(cid:87)(cid:72)(cid:66)(cid:70)(cid:82)(cid:81)(cid:86)(cid:89)(cid:68)(cid:85)(cid:86)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:86)(cid:87)(cid:72)(cid:83)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:85)(cid:72)(cid:86)(cid:76)(cid:71)(cid:88)(cid:68)(cid:79)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:89)(cid:68)(cid:79)(cid:88)(cid:72)
(cid:68)(cid:89)(cid:72)(cid:85)(cid:68)(cid:74)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)(cid:17)(cid:85)(cid:72)(cid:85)(cid:88)(cid:81)(cid:66)(cid:76)(cid:82)
(cid:80)(cid:82)(cid:81)(cid:76)(cid:87)(cid:82)(cid:85)
(cid:88)(cid:71)(cid:73)(cid:66)(cid:80)(cid:82)(cid:81)(cid:76)(cid:87)(cid:82)(cid:85)
(cid:88)(cid:71)(cid:73)(cid:66)(cid:83)(cid:82)(cid:86)(cid:87)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:86)(cid:88)(cid:80)(cid:80)(cid:68)(cid:85)(cid:92)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:80)(cid:72)(cid:80)(cid:66)(cid:71)(cid:72)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:41)(cid:44)(cid:49)(cid:36)(cid:47)(cid:44)(cid:61)(cid:40)
11.3.2.18 metric
Name: metric
Description: Subroutine to calculate transformation metric terms for inviscid and viscous
terms, includes face vectors, volumes, cell centroids.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:76)(cid:82)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:80)(cid:72)(cid:87)(cid:85)(cid:76)(cid:70)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:76)(cid:81)(cid:87)(cid:72)(cid:85)(cid:81)(cid:68)(cid:79)(cid:66)(cid:70)(cid:72)(cid:79)(cid:79)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:81)(cid:82)(cid:71)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:90)(cid:68)(cid:79)(cid:79)(cid:66)(cid:70)(cid:72)(cid:79)(cid:79)
(cid:83)(cid:79)(cid:82)(cid:87)(cid:66)(cid:86)(cid:87)(cid:68)(cid:87)(cid:76)(cid:86)(cid:87)(cid:76)(cid:70) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:86)(cid:72)(cid:93)(cid:66)(cid:80)(cid:72)(cid:87)(cid:85)(cid:76)(cid:70)
(cid:76)(cid:81)(cid:87)(cid:72)(cid:85)(cid:81)(cid:68)(cid:79)(cid:66)(cid:70)(cid:72)(cid:79)(cid:79)
(cid:89)(cid:82)(cid:79)(cid:66)(cid:70)(cid:87)(cid:85)
(cid:90)(cid:68)(cid:79)(cid:79)(cid:66)(cid:70)(cid:72)(cid:79)(cid:79)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:89)(cid:82)(cid:79)(cid:88)(cid:80)(cid:72)(cid:66)(cid:86)(cid:76)(cid:74)(cid:81)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:89)(cid:82)(cid:79)(cid:88)(cid:80)(cid:72)(cid:66)(cid:86)(cid:76)(cid:74)(cid:81)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:83)(cid:72)(cid:85)(cid:76)(cid:82)(cid:71)(cid:76)(cid:70)(cid:66)(cid:69)(cid:82)(cid:88)(cid:81)(cid:71)(cid:68)(cid:85)(cid:92)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)(cid:66)(cid:83)(cid:72)(cid:85)(cid:76)(cid:82)(cid:71)(cid:76)(cid:70)(cid:66)(cid:69)(cid:82)(cid:88)(cid:81)(cid:71)(cid:68)(cid:85)(cid:92)
PMBFS2 User’s Manual 121

## 페이지 131
11.3. Program Structure
11.3.2.19 monitor
Name: monitor
Description: Monitor the evolution of the flow field and record instantaneous variables at
various locations.
11.3.2.20 pmbfs_data_mod
Name: pmbfs_data_mod
Description: Module file of data and variables for the frame of program PMBFS2 .
11.3.2.21 pmbfs_io
Name: pmbfs_io
Description: Module file including most subroutines for IO.
11.3.2.22 pmbfs_mod
Name: pmbfs_mod
Description: Module file including all general subroutines/functions called by the program.
11.3.2.23 propin
Name: propin
Description: Subroutine to initialize thermodynamic and transport properties.
11.3.2.24 residual
Name: residual
Description: Subroutine to calculate residual.
11.3.2.25 rhs
Name: rhs
Description: Right-Hand-Side calculation subroutine. Each viscous and inviscid flux subrou-
tines are called and DQ is updated at each node in computational domain.
Call: cflux_s, addvis_s, syplus, vflux_s, sgflux_s, velfil_d, sgs_coeff, sgsdyn,
11.3.2.26 smooth
Name: smooth
Description: Subroutine to perform the Implicit Residual Smoothing(IRS).
11.3.2.27 solve
Name: solve
Description: main solver using explicit/implicit, physical/pseudo time marching.
122 PMBFS2 User’s Manual

## 페이지 132
Chapter 11. Software Framework: Design, Structure and Implementation
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:85)(cid:75)(cid:86)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:66)(cid:53)(cid:43)(cid:54)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:39)(cid:68)(cid:87)(cid:68)(cid:66)(cid:41)(cid:82)(cid:85)(cid:66)(cid:48)(cid:50)(cid:38)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:66)(cid:53)(cid:43)(cid:54)
(cid:70)(cid:86)(cid:75)(cid:76)(cid:73)(cid:87)
(cid:70)(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:70)(cid:72)(cid:81)(cid:87)(cid:85)(cid:68)(cid:79)
(cid:39)(cid:68)(cid:87)(cid:68)(cid:66)(cid:41)(cid:82)(cid:85)(cid:66)(cid:48)(cid:50)(cid:38)
(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:86)
(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:86)(cid:87)(cid:89)(cid:71)
(cid:68)(cid:71)(cid:71)(cid:89)(cid:76)(cid:86)(cid:66)(cid:80)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:70)(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:88)(cid:83)(cid:90)(cid:76)(cid:81)(cid:71)
(cid:70)(cid:73)(cid:79)(cid:88)(cid:91)(cid:66)(cid:75)(cid:92)(cid:69)(cid:85)(cid:76)(cid:71)
(cid:89)(cid:73)(cid:79)(cid:88)(cid:91)
(cid:70)(cid:75)(cid:72)(cid:80)(cid:66)(cid:76)(cid:74)(cid:81)(cid:76)(cid:87)(cid:72)
(cid:70)(cid:75)(cid:72)(cid:80)(cid:66)(cid:70)(cid:20)(cid:21)(cid:75)(cid:21)(cid:23)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:70)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:81)(cid:89)
(cid:51)(cid:48)(cid:37)(cid:41)(cid:54)(cid:21) (cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:70)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:85)(cid:75)(cid:86)
(cid:70)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:38)(cid:40)(cid:50)(cid:54)
(cid:70)(cid:75)(cid:72)(cid:80)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:80)(cid:83)(cid:79)(cid:76)(cid:70)(cid:76)(cid:87)
(cid:70)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:81)(cid:89)
(cid:86)(cid:80)(cid:82)(cid:82)(cid:87)(cid:75)
(cid:69)(cid:70)(cid:66)(cid:80)(cid:82)(cid:70)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:85)(cid:78)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:71)(cid:76)(cid:68)(cid:74)(cid:68)(cid:71)(cid:76)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)
(cid:69)(cid:70)(cid:66)(cid:69)(cid:79)(cid:82)(cid:70)(cid:78)
(cid:69)(cid:70)(cid:66)(cid:83)(cid:68)(cid:85)(cid:68)(cid:79)(cid:79)(cid:72)(cid:79)
(cid:69)(cid:70)
(cid:72)(cid:82)(cid:86)
(cid:87)(cid:85)(cid:68)(cid:81)(cid:86)(cid:83)
PMBFS2 User’s Manual 123

## 페이지 133
11.3. Program Structure
11.3.2.28 solve_rk
Name: solve_rk
Description: Subroutine to update variables using explicit low storage Runge-Kutta method.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:85)(cid:78)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:86)(cid:88)(cid:80)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:71)(cid:76)(cid:68)(cid:74)(cid:68)(cid:71)(cid:76)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:66)(cid:68)(cid:71)(cid:76) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:70)(cid:86)(cid:75)(cid:76)(cid:73)(cid:87)
(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:66)(cid:68)(cid:71)(cid:76)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:20)(cid:71)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:36)(cid:37)(cid:50)(cid:53)(cid:55)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:21)(cid:71)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:20)(cid:71)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:22)(cid:71)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:21)(cid:71)
(cid:80)(cid:88)(cid:79)(cid:87)(cid:66)(cid:77)(cid:68)(cid:70)(cid:82)(cid:69)
(cid:79)(cid:88)(cid:86)(cid:86)(cid:82)(cid:85)(cid:66)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)(cid:22)(cid:71)
(cid:71)(cid:76)(cid:68)(cid:74)(cid:82)(cid:81)(cid:68)(cid:79)
11.3.2.29 solve_diagadi
Name: solve_diagadi
Description: Subroutine to update variables using implicit diagonalized Alternating Direc-
tions Implicit (ADI) method.
11.3.2.30 solve_lussor
Name: solve_lussor
Description: Subroutine to update variables using implicit scalar Lower-Upper Symmet-
ric Successive Over Relaxation (LU-SSOR) or Lower-Upper Symmetric Gauss-Seidel (LU-SGS)
method.
124 PMBFS2 User’s Manual

## 페이지 134
Chapter 11. Software Framework: Design, Structure and Implementation
11.3.2.31 spray_constant, spray_data_structure, spray_variables
Name: spray_constant, spray_data_structure, spray_variables
Description: The basic data modules for two-phase flow.
11.3.2.32 spray_mod
Name: spray_mod
Description: Datamoduleincludesallsubroutinesandfunctionswhicharerelatedwithspray
but independent of physics.
11.3.2.33 spray_physics
Name: spray_physics
Description: Datamoduleincludesallsubroutinesandfunctionswhicharerelatedwithspray
but independent of physics.
11.3.2.34 spray_solve
Name: spray_solve
Description: Subroutine for spray phase calculation using Lagrangian system.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:83)(cid:75)(cid:92)(cid:86)(cid:76)(cid:70)(cid:86)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:85)(cid:72)(cid:86)(cid:72)(cid:87)(cid:66)(cid:83)(cid:68)(cid:85)(cid:70)(cid:72)(cid:79)
(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:89)(cid:68)(cid:85)(cid:76)(cid:68)(cid:69)(cid:79)(cid:72)(cid:86)(cid:17)(cid:85)(cid:72)(cid:83)(cid:68)(cid:70)(cid:78)(cid:66)(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:83)(cid:75)(cid:92)(cid:86)(cid:76)(cid:70)(cid:86)(cid:17)(cid:76)(cid:81)(cid:77)(cid:72)(cid:70)(cid:87)(cid:76)(cid:82)(cid:81)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:83)(cid:75)(cid:92)(cid:86)(cid:76)(cid:70)(cid:86)(cid:17)(cid:69)(cid:85)(cid:72)(cid:68)(cid:78)(cid:88)(cid:83)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:83)(cid:75)(cid:92)(cid:86)(cid:76)(cid:70)(cid:86)(cid:17)(cid:87)(cid:90)(cid:82)(cid:66)(cid:90)(cid:68)(cid:92)(cid:66)(cid:70)(cid:82)(cid:88)(cid:83)(cid:79)(cid:76)(cid:81)(cid:74)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:83)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:83)(cid:75)(cid:92)(cid:86)(cid:76)(cid:70)(cid:86)(cid:17)(cid:71)(cid:85)(cid:82)(cid:83)(cid:79)(cid:72)(cid:87)(cid:66)(cid:86)(cid:87)(cid:68)(cid:87)(cid:72)(cid:66)
(cid:70)(cid:75)(cid:72)(cid:70)(cid:78)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:86)(cid:87)(cid:68)(cid:87)(cid:76)(cid:86)(cid:87)(cid:76)(cid:70)
(cid:54)(cid:44)(cid:61)(cid:40)
(cid:86)(cid:88)(cid:80)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:37)(cid:36)(cid:53)(cid:53)(cid:44)(cid:40)(cid:53)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:53)(cid:40)(cid:39)(cid:56)(cid:38)(cid:40)
(cid:80)(cid:68)(cid:91)(cid:89)(cid:68)(cid:79)
11.3.2.35 spray_mpi
Name: spray_mpi
Description: Subroutine for spray operation between parallel computation nodes.
PMBFS2 User’s Manual 125

## 페이지 135
11.3. Program Structure
11.3.2.36 timestep
Name: timestep
Description: This subroutine calculates the time step for both steady and unsteady calcula-
tions. Local time step is obtained for steady calculations and constant time-step is obtained for
unsteady calculation.
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:86)(cid:83)(cid:85)(cid:68)(cid:92)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:87)(cid:76)(cid:80)(cid:72)(cid:86)(cid:87)(cid:72)(cid:83)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:86)(cid:88)(cid:80)
(cid:51)(cid:48)(cid:37)(cid:41)(cid:54)(cid:21)
(cid:80)(cid:68)(cid:91)(cid:89)(cid:68)(cid:79)
(cid:80)(cid:76)(cid:81)(cid:79)(cid:82)(cid:70)
(cid:80)(cid:76)(cid:81)(cid:89)(cid:68)(cid:79)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:85)(cid:72)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:66)(cid:76)(cid:77)(cid:78)
(cid:48)(cid:51)(cid:44)(cid:66)(cid:36)(cid:47)(cid:47)(cid:53)(cid:40)(cid:39)(cid:56)(cid:38)(cid:40)
11.3.2.37 timer_mod
Name: timer_mod
Description: Data module and operation for all-purpose code performance monitoring rou-
tines.
11.3.2.38 transp
Name: transp
Description: Subroutine to calculate thermodynamic and transport properties.
11.3.2.39 turb_models
Name: turb_models
Description: Subroutine to manage turbulence modeling.
11.3.2.40 turb_bldlmx
Name: turb_bldlmx
Description: SubroutinetocalculateturbulenteddyviscosityusingBaldwin-Lomaxtwo-layer
model.
11.3.2.41 turb_spalart
Name: turb_spalart
Description: Subroutine to calculate turbulent eddy viscosity and source terms using 1-
equation Spalart-Allmaras turbulence model.
126 PMBFS2 User’s Manual

## 페이지 136
Chapter 11. Software Framework: Design, Structure and Implementation
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:80)(cid:82)(cid:71)(cid:72)(cid:79)(cid:86)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:87)(cid:85)(cid:68)(cid:81)(cid:86)(cid:83) (cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:69)(cid:79)(cid:71)(cid:79)(cid:80)(cid:91)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:78)(cid:72)(cid:83)(cid:86)(cid:79)(cid:81)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:78)(cid:82)(cid:80)(cid:72)(cid:74)(cid:68)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:86)(cid:74)(cid:86)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:78)(cid:82)(cid:80)(cid:72)(cid:74)(cid:68)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:81)(cid:82)(cid:71)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:80)(cid:82)(cid:71)(cid:72)(cid:79)(cid:86)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:71)(cid:80)(cid:68)(cid:91)(cid:20)
(cid:71)(cid:86)(cid:84)(cid:85)(cid:87)
(cid:71)(cid:80)(cid:76)(cid:81)(cid:20)
(cid:71)(cid:87)(cid:68)(cid:81)(cid:75)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:81)(cid:87)(cid:72)(cid:85)(cid:81)(cid:68)(cid:79)(cid:66)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:76)(cid:87)(cid:72)(cid:85)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:66)(cid:86)(cid:87)(cid:72)(cid:83)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:86)(cid:74)(cid:86)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29) (cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:87)(cid:88)(cid:85)(cid:69)(cid:66)(cid:80)(cid:82)(cid:71)(cid:72)(cid:79)(cid:86) (cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71)(cid:17)(cid:68)(cid:79)(cid:79)(cid:82)(cid:70)(cid:68)(cid:87)(cid:72)(cid:66)(cid:76)(cid:83)
(cid:76)(cid:81)(cid:76)(cid:87)(cid:66)(cid:86)(cid:82)(cid:79)(cid:89)(cid:72)(cid:85) (cid:86)(cid:88)(cid:80)
PMBFS2 User’s Manual 127

## 페이지 137
11.3. Program Structure
11.3.2.42 turb_kepsln
Name: turb_kepsln
Description: Subroutinetocalculateturbulenteddyviscosityandsourcetermsusingk-epsilon
type models.
11.3.2.43 turb_komega
Name: turb_komega
Description: Subroutinetocalculateturbulenteddyviscosityandsourcetermsusingk-omega
type models.
11.3.2.44 turb_sgs
Name: turb_sgs
Description: Subroutine to calculate the subgrid-scale turbulent viscosity using compressible
flow version of Smagorinsky subgrid-scale model.
11.3.2.45 turb_wdist
Name: turb_wdist
Description: Subroutine to calculate distance of each cell centers to the nearest no-slip wall.
11.3.2.46 udf_init
Name: udf_init
Description: User-Defined-Functions (UDF) to initialize the flow fields.
11.3.2.47 udf_monitor
Name: udf_monitor
Description: User-Defined-Functions (UDF) to monitor the calculation.
11.3.2.48 udf_postsolve
Name: udf_postsolve
Description: User-Defined-Functions (UDF) to perform user specified post processing.
11.3.2.49 update_consvars
Name: update_consvars
ˆ ˆ ˆ
Description: SubroutinetoupdateconservativevariablesQ{n},Q{n-1},Q{n-2}fordual-time
stepping.
11.3.2.50 vflux
Name: vflux
Description: Subroutine to calculate viscous flux using "approximate" second order finite
difference method in transformed space.
128 PMBFS2 User’s Manual

## 페이지 138
Chapter 11. Software Framework: Design, Structure and Implementation
(cid:51)(cid:68)(cid:85)(cid:68)(cid:80)(cid:72)(cid:87)(cid:72)(cid:85)(cid:86)(cid:29)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:86)(cid:86)(cid:68)(cid:76)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:86)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:86)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:86)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:72)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:72)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:72)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:93)(cid:91)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:93)(cid:92)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:89)(cid:86)(cid:93)(cid:93)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:70)(cid:79)
(cid:53)(cid:40)(cid:36)(cid:47)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:50)(cid:56)(cid:55)(cid:12)(cid:3)(cid:71)(cid:84)(cid:84)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:83)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:77)(cid:78)(cid:87)(cid:82)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:70)(cid:72)(cid:79)(cid:79)(cid:66)(cid:86)(cid:87)(cid:68)(cid:85)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:86)(cid:87)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:72)
(cid:56)(cid:86)(cid:72)(cid:86)(cid:29)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:77)(cid:72)
(cid:83)(cid:80)(cid:69)(cid:73)(cid:86)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:78)(cid:72)
(cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:71)(cid:76)(cid:85)(cid:86)(cid:90)(cid:72)(cid:72)(cid:83)
(cid:87)(cid:76)(cid:80)(cid:72)(cid:85)(cid:66)(cid:80)(cid:82)(cid:71) (cid:44)(cid:49)(cid:55)(cid:40)(cid:42)(cid:40)(cid:53)(cid:3)(cid:44)(cid:49)(cid:55)(cid:40)(cid:49)(cid:55)(cid:11)(cid:44)(cid:49)(cid:12)(cid:3)(cid:76)(cid:71)(cid:76)(cid:85)
(cid:54)(cid:88)(cid:69)(cid:85)(cid:82)(cid:88)(cid:87)(cid:76)(cid:81)(cid:72)(cid:3)(cid:89)(cid:73)(cid:79)(cid:88)(cid:91)
(cid:38)(cid:68)(cid:79)(cid:79)(cid:72)(cid:71)(cid:3)(cid:37)(cid:92)(cid:29)
(cid:44)(cid:81)(cid:89)(cid:82)(cid:70)(cid:68)(cid:87)(cid:76)(cid:82)(cid:81)(cid:86)(cid:29)
(cid:85)(cid:75)(cid:86) (cid:80)(cid:68)(cid:87)(cid:80)(cid:88)(cid:79)
11.4 Code Implementation
11.4.1 Programming Rules
In order to provide a framework for the use of Fortran 90 in PMBFS2 software and thereby
to facilitate the exchange of code between CFD communities, some programming rules should
be utilized. In order to achieve this goal we set standards for the documentation of code, both
internal and external to the software itself, as well as setting standards for writing the code.
The latter standards are designed to improve code readability and maintainability as well as to
ensure, as far as possible, its portability, efficiency and performance. The detailed programming
rules and coding styles are described in the "Coding Standard" document.
11.4.2 Programming Environment
11.4.2.1 Operating System
Linux
Linux is the most common platform for high performance computing.
Windows
11.4.2.2 Compiler
Fortran90compilerisusedtocompileandexecutetheprogram. Highlystandardandefficient
compiler should be utilized to minimize the compiling and computation time. The widely used
Fortran90 compilers are GNU gfortran, Intel Fortran, PGI Fortran and Pathscale Fortran.
PMBFS2 User’s Manual 129

## 페이지 139
11.4. Code Implementation
Intel Fortran
The Intel compilers icc (C/C++) and ifort (Fortran 77/90/95) are available from Intel’s
website, http://www.intel.com. After registration, you will receive an e-mail with license code
and download link. After downloading, ifort is installed by
tar xfz l_fc_c_9.1.036.tar.gz
cd l_fc_c_9.1.036
./install.sh
Default installation directory is /opt/intel/fce/9.1.036. Add the binary directory (in the
example /opt/intel/fce/9.1.036/bin) to your PATH. It may also be necessary to add
/opt/intel/fce/9.1.036/lib to your dynamic linker search path. How to do this depends on
your Linux distribution, usually it is done by editing /etc/ld.so.conf and running ldconfig.
The Intel compilers come with extensive documentation. A few common options are shown
here:
• -L/path: Search path for linking against libraries,
• -xW: enable optimisations for SSE2-capable CPUs (Pentium 4, newer AMD CPUs),
• -xP: enable optimisations for SSE3-capable CPUs (newer Pentium 4s, Intel Core and
newer). Although some AMD CPUs support SSE3, programs compiled with -xP will not
run on these due to processor detection,
• -fast: full optimisations, which is usually recommended on Intel CPUs (may be failed on
AMD CPUs),
• -O3: full optimisations,
• -openmp: enable OpenMP.
There are many other options, especially concerning optimisations. Feel free to experiment
with these.
gfortran
gfortran is a rewrite of the GNU g77 Fortran compiler. It is available from http://gcc.gnu.
org/wiki/GFortran. It supports Fortran 77, 90 and 95. The newest versions also have support
for OpenMP. If you’re lucky, your distribution may already come with a current version of
gfortran. If not, you should look for prebuilt binary packages, or you may have to compile
gfortran from source. The gfortran website will give further assistance.
Common compile options are:
• -L/path: Search path for linking against libraries,
• -O3: full optimisations,
• -openmp: enable OpenMP.
OpenMP
OpenMP (OpenMP, 2002) is a standard for writing multithreaded programs. Multithreaded
means that parts of a program are run in parallel. Data exchange between threads is done
130 PMBFS2 User’s Manual

## 페이지 140
Chapter 11. Software Framework: Design, Structure and Implementation
implicitlybyaccessingmemory. OpenMPhastheadvantagethatitiseasytouseforparallelising
loops. Itsdisadvantageisthatitisonlyusableonsharedmemorysystems. SinceVersion9.1, the
Intel compilers also support Cluster OpenMP, an OpenMP version that uses message passing.
The OpenMP standard can be downloaded from http://www.openmp.org. OpenMP has to
be supported by the compiler. At the moment, there are two freely available (Intel only for
non-commercial purposes) OpenMP-capable compilers: Intel icc/ifort and GNU gcc/gfortran.
MPI
MPI(messagepassinginterface)isastandardformessagepassing,theparallelisationmethod
most commonly used for distributed memory architectures. There are many implementations of
MPI for different system architectures, communication networks, and operating systems. The
MPIstandardisdefinedbytheMPIforumandcanbefoundon-lineat http://www.mpi-forum.
org/.
MPICH is a popular implementation of the MPI standard. More information, software pack-
agesandinstallationinstructionscanbefoundathttp://www-unix.mcs.anl.gov/mpi/mpich2/.
MPICH comes with an excellent installation guide.
Open MPI emerged from a number of other MPI implementations. The goal is to create
the best MPI library. Open MPI supports a number of network architectures, among them
shared memory, Ethernet, Myrinet, and Infiniband. Detailed information on the installation and
configuration can be found on the Open MPI website, http://www.open-mpi.org/. Only short
descriptions can be given here. After downloading, do:
bzip2 -d openmpi-1.1.1.tar.bz2
tar xf openmpi-1.1.1.tar
cd openmpi-1.1.1
./configure --prefix=/opt
make all install
You can then compile MPI programs with mpicc, mpic++, and mpif90. Using these commands
automatically links against the required MPI libraries. Programs are started with the mpirun
command.
mpirun –hostfile hosts -np 2 ./program
The hostfile should contain the nodes, one node per file. For multiprocessor nodes, you may
want to add slots=number of processors. Don’t due this if you use multi-threaded programs, use
OMP_NUM_THREADS instead. You can also directly specify execution hosts by –host n01,n02,...
.
11.4.3 Performance Analysis
11.4.3.1 Timing
Before optimizing a program, we first need to know which parts of a program need the most
computation time. It does not make sense to spend a lot of time and effort parallelising program
parts that contribute only very little to the total runtime.
For the performance analysis, we want to know the runtime required by individual parts of a
program. There are several programming language and operating system dependent methods for
measuringtimeinsideaprogram. BothMPIandOpenMPhavetheirown, platformindependent
functions for time measurement. MPI_Wtime() and omp_get_wtime() return the wall time in
seconds, the difference between the results of two such function calls yields the runtime elapsed
between the two function calls.
PMBFS2 User’s Manual 131

## 페이지 141
11.4. Code Implementation
Table 11.2: Performance analysis example of PMBFS2
==============================================================================
timer_summary: code performance summary
beginning : 09-20-2008 03:57.01
ending : 09-20-2008 04:01.50
seconds in monitoring period : 286.672
number of subintervals : 5000
------------------------------------------------------------------------------
accounting unit time sec num calls secs avg time pct
------------------------------------------------------------------------------
PMBFS2 286.672 1 286.672 100.000
init_solver 0.047 1 0.047 0.016
mainloop 286.562 1 286.562 99.962
timestep 3.219 5000 0.001 1.123
solve 280.578 5000 0.056 97.874
rhs 222.250 15000 0.015 77.528
cflux_upwind 147.812 60000 0.002 51.562
vflux 61.719 60000 0.001 21.529
c_solve_inv 7.484 15000 0.000 2.611
solve_rk 2.828 15000 0.000 0.987
post_solver 0.063 1 0.063 0.022
==============================================================================
In PMBFS2 , an all-purpose code performance monitoring routines are integrated in a For-
tran90 module timer_mod. The module starts/stops the timer, accumulates time in dynamically
assigned accounting segments, and writes a job performance summary on program completion.
A simple example is presented in the following table.
11.4.3.2 Profiling
A more detailed method of performance analysis is called profiling. Profiling can give the
detailed running time of every subroutine in the program, and the user can improve the code
according to the profiling result. For profiling, the program has to be built with information for
the profiler. This is done with the switch -pg for gfortran and -p for Intel Fortran.
After compilation, the program has to be run regularly. This program run creates the file
gmon.out required by the profiler gprof. Executing gprof program > prof.txt creates a text
file with the profiling information. The first item contained in the file is the flat profile. It
lists all function/subroutine calls, the time used for them, the percentage of the total time, and
the number of calls, among other information. The second item is the call tree, a listing of all
routines call by the subroutines of the program.
For Intel CPUs, Intel provides an advanced performance measurement tool called VTUNE.
The Linux version is available free of charge for non-commercial purposes from Intel’s website,
http://www.intel.com. VTUNE offers the functionality of a profiler, but can also measure
the number of integer and floating point operations during a program call. This is very useful
quantitative information to measure the performance of the program.
Many supercomputers come with integrated counters for measuring performance, i.e. NEC
132 PMBFS2 User’s Manual

## 페이지 142
Chapter 11. Software Framework: Design, Structure and Implementation
SX-8 SMP system. These make it very simple to assess performance. If you are lucky to
have access to such a machine, the system’s documentation should contain information about
performance measurement.
Please note that the goal of parallelisation and optimisation is not to maximise the efficiency,
but to minimise the runtime required for a program. Sometimes, one algorithm may be less
efficient than another, but also require a smaller number of floating point operations, resulting
in a shorter runtime.
11.4.4 Version Release
The PMBFS2 CFD solver is a computer program for the calculation of steady or time-
accuratethree-dimensional,chemicallyreactingturbulentreal-fluidflowswithandwithoutsprays.
The project aims to design and develop the next generation high fidelity CFD solver for Large-
Eddy-Simulationofcomplexengineeringturbulentflowswithstate-of-the-artnumericalmethods
on high efficient structured grid.
Milestone 1：：：Baseline Code: Framework Design & Implementation
Object
1. PMBFS2 baseline code, including framework design and implementation
2. Application test: Jet in Cross Flow
Metrics
1. Preconditioning method for low-speed flow
2. Spatial discretization: 2nd/4th central scheme and 3rd/5th upwind scheme
3. Temporal discretization: explicit RK scheme and implicit ADI scheme
4. Large eddy simulation: static and dynamic SGS models
5. Parallel computation
Milestone 2：：：Robust Delivery: All-Speed Application
Object
1. Robust delivery for multi species chemical reacting flow
2. Application test: Supersonic mixing
Metrics
1. Multi species module
2. Chemical reaction module: embedded function and linked CHEMKIN library
3. Turbulent modeling: one equation S-A model and two equation model
4. DES and hybrid LES/RANS simulation
5. Algorithm improvement: LU-SGS etc.
Milestone 3：：：Software Improvement
Object
1. High fidelity and high efficiency
2. State-of-the-art numerical methods
Metrics
PMBFS2 User’s Manual 133

## 페이지 143
11.4. Code Implementation
1. General equation of state: real-fluid
2. Two-phase simulation
3. Multigrid acceleration
4. Algorithm improvement: hybrid central/upwind scheme
5. Parallel efficiency: hybrid MPI/OpenMP
134 PMBFS2 User’s Manual

## 페이지 144
Chapter 12
Getting Started: Installation and
Execution
12.1 Code Directory Structure
Switch to the directory where you want to install PMBFS2 and unpack the tar-file
tar zxvf PMBFS2.tar.gz
This will generate in the current directory the following subdirectories
PMBFS2/ +
|+ src/
| CHANGES.txt ## PMBFS2 version history
|
| Makefile ## Makefile system
| Make_Comm
| Make_Main
| Make_Post_Processing
| Makesystem_cygwin
| Makesystem_intel
|
| main.F90 ## main driver
|
| pmbfs.h ## data modules - header
| pmbfs_data_mod.F90 # data modules - defination
| pmbfs_mod.F90 # data modules - operation
|
| solve.F90 ## top level flow solver
| updtrt.F90
| rhs.F90
|
| cflux_upwind.F90 ## spatial discretization subroutines
| cflux_hybrid.F90
| cflux_central.F90
| artvis_m.F90
135

## 페이지 145
12.1. Code Directory Structure
| artvis_s.F90
| vflux.F90
|
| solve_rk.F90 ## temporal discretization subroutines
| solve_diagadi.F90
| solve_lussor.F90
| timestep.F90
| smooth.F90
|
| bc.F90 ## physical boundaries subroutines
| bc_block.F90
| bc_moc.F90
| bc_parallel.F90 ## parallel boundaries subroutines
|
| eos.F90 ## EOS and transport quantities
| transp.F90
|
| propin.F90 ## fluid properties subroutines
| propin_c12h24.F90
| propin_c2h4.F90
| propin_c3h8.F90
| propin_ch4.F90
| propin_o2h2.F90
|
| turb_models.F90 ## turbulent modeling subroutines
| turb_bldlmx.F90
| turb_spalart.F90
| turb_kepsln.F90
| turb_komega.F90
| turb_sgs.F90
| turb_wdist.F90
|
| chem.F90 ## chemical reacting subroutines
| chem_c12h24.F90
| chem_c2h4.F90
| chem_ignite.F90
|
| spray_module.F90 ## two-phase subroutines
| spray_variables.F90
| spray_physics.F90
| spray_solve.F90
| spray_mpi.F90
|
| metric.F90 ## geometry subroutines
|
| init_solver.F90 ## initialize subroutines
| init_flowfield.F90
| init_perturb.F90
136 PMBFS2 User’s Manual

## 페이지 146
Chapter 12. Getting Started: Installation and Execution
|
| udf_init.F90 ## user defined functions
| udf_monitor.F90
| udf_postsolve.F90
|
| pmbfs_io.F90 ## input/output subroutines
|
| post_calc.F90 ## post-processing subroutines
| post_readspray.F90
| post_statistic.F90
|
| residual.F90 ## miscellaneous subroutines
| monitor.F90
| average.F90
| average_mod.F90
| check_value.F90
| tsolve.F90
|
| timer_mod.F90 ## performance monitor subroutines
| lib.F90 ## library subroutines
|
|+ doc/ ## PMBFS2 documents
|
|+ vav/ + ## verification and validation cases
| |+ 2D/ +
| | |+ airfoil/
| | |+ bfs/
| | |+ cylinder/
| | |+ cylinder_p/
| | |+ rbcc/
| |+ 3D/ +
| | |+ cduct/
| | |+ cylinder_p/
12.2 Compiling the Code
The code can be running under Windows or Linux type operating systems. Generally, com-
piling the code needs a FORTRAN90 compiler, such as Compaq Visual Fortran compiler under
Windows, GNU gfortran compiler under cygwin or Linux environment, Intel Fortran compiler
under Windows or Linux OS, PGI Fortran compiler under Windows or Linux OS.
12.2.1 FORTRAN Pre-Processing
In order to facilitate the code to calculate various scientific and engineering problems, the
MACRO definition technique is utilized, and the FORTRAN pre-processing utility is essential.
Twomethodsareusedtodothepre-processing. OneisusingCPPpre-processingutility. Youcan
usetheCcompilertodothepre-processingandgetthepureFORTRANsourcecodewithoutany
macrodefinitions. AnothermethodusestheextendedFORTRANfunctionformoderncompilers.
PMBFS2 User’s Manual 137

## 페이지 147
12.2. Compiling the Code
Generally,themoderncompilercanpre-processthemacrodefinition,eventhedetailedcommand
options are different for individual compiler.
The MACRO definitions are:
DOUBLEP
PARALLEL
DUALTIME
SPECIES
TURBRANS
TURBLES
The description of the macro definition:
DOUBLEP if defined, double precision; if not defined, single precision;
PARALLEL if defined, MPI parallel communication is utilized for parallel version; if
not, serial version;
DUALTIME if defined, dual-time stepping is utilized with pseudo-time term for all-
speed calculation with or without preconditioning technique; if not, only
physical time exists in the steady or unsteady calculation;
SPECIES if defined, multi-species calculation executes for multi-species mixing or
chemical-reacting flow; if not, only single specie calculation executes;
TURBRANS if defined, RANS turbulent modeling is utilized; if not, DNS is utilized
for laminar flow or turbulent flow;
TURBLES if defined, Large-Eddy simulation executes for the turbulent flow.
The macro definitions are pre-processed by the second method, which use the macro pre-
processing utility in the FORTRAN compiler. User should change the macro definition in
the Makefile according to the flow. Now the macro definitions are defined in FPPFLAGS of
Makesystem_cygwin or Makesystem_intel. Makesystem_cygwin is the file which defines the
compiler options for the compiler under cygwin environment. Makesystem_intel is the file
which defines the compiler options for the Intel compiler.
For Intel compiler or Visual Fortran compiler under cygwin environment on Windows, you
can change the FPPFLAGS in Makesystem_cygwin as follows,
# serial code, single precision,
# steady or unsteady calculation with only physical time
FPPFLAS =
# serial code, double precision,
# steady or unsteady calculation with only physical time
FPPFLAGS= -fpp -DDOUBLEP
# parallel code, double precision,
# steady or unsteady calculation with only physical time
FPPFLAGS= -fpp -DDOUBLEP -DPARALLEL
# parallel code, double precision,
# steady or unsteady calculation with preconditioning technique
FPPFLAGS= -fpp -DDOUBLEP -DPARALLEL -DDUALTIME
138 PMBFS2 User’s Manual

## 페이지 148
Chapter 12. Getting Started: Installation and Execution
# parallel code, double precision, k-omega turbulent model
FPPFLAGS= -fpp -DDUALTIME -DDOUBLEP -DTURBRANS
# parallel code, double precision,
# multi-species chemical-reacting flow
FPPFLAGS= -fpp -DDUALTIME -DDOUBLEP -DSPECIES
# parallel code, double precision,
# multi-species chemical-reacting flow with hybrid RANS/LES
FPPFLAGS= -fpp -DDUALTIME -DDOUBLEP -DSPECIES -DTURBRANS -DTURBLES
# parallel code, double precision,
# two-phase combustion
FPPFLAGS= -fpp -DDUALTIME -DDOUBLEP -DSPECIES -DTURBLES
For PGI Fortran compiler under cygwin environment on Windows, you can change the
FPPFLAGS in Makesystem_cygwin as follows, (where neglects the -fpp option)
# parallel code, double precision,
# steady or unsteady calculation with preconditioning technique
FPPFLAGS= -DDOUBLEP -DPARALLEL -DDUALTIME
# parallel code, double precision,
# multi-species chemical-reacting flow with hybrid RANS/LES
FPPFLAGS= -DDUALTIME -DDOUBLEP -DSPECIES -DTURBRANS -DTURBLES
# parallel code, double precision,
# two-phase combustion
FPPFLAGS= -DDUALTIME -DDOUBLEP -DSPECIES -DTURBLES
12.2.2 Definition of Parameters
Beforecompilingthecode,theparametersfilemustbeeditedfortheparticularflowfieldyou
are interested in. The size of the code and the characteristics of the grid you run on are defined
inthisfile. Becauseofthecomplexityofthecode, thereareunforunatelyseveralparametersthat
must be set. These parameters typically indicate the maximum number of something allowable.
All the parameters are defined in pmbfs.h header file. Every time you change the geometry or
setting of the flow, you should modify the pmbfs.h file at first.
The pmbfs.h is
#define NEQ 7
#define NUM_FLOW_EQNS 5
#define NUM_TURB_EQNS 2
#define NUM_PASS_EQNS 0
#define NUM_SPEC 0
#define NSM 0
#define NUM_BLK_MAX 3
#define NUM_CELL_MAX 200000
#define NUM_BCCELL_MAX 10000
#define IJK_MAX 412
A description of the parameters is as follows
PMBFS2 User’s Manual 139

## 페이지 149
12.2. Compiling the Code
NEQ Number of independent variables
NUM_FLOW_EQNS Number of flow equations, NUM_FLOW_EQNS=5 in general case
NUM_TURB_EQNS Number of turbulent equations,
NUM_FLOW_EQNS = 0 for laminar case, Baldwin-Lomax RANS, LES
NUM_FLOW_EQNS = 1 for Spalart-Allmaras turbulence model,
NUM_FLOW_EQNS = 2 for k−(cid:178) and k−ω turbulence model
NUM_PASS_EQNS Number of passive scalar equation, or multi-species equations,
NUM_FLOW_EQNS = 0 for single specie or without passive scalar,
NUM_FLOW_EQNS = NUM_SPEC-1 for multi-species case
NUM_SPEC Number of multi-species
NSM NSM = 0 for single specie case,
NSM = NUM_SPEC-1 for multi-species case
NUM_BLK_MAX Maximum number of multiple blocks in one processor
NUM_CELL_MAX Maximum number of finite volume cells in one processor
NUM_BCCELL_MAX Maximum number of boundary cells in one processor
IJK_MAX Maximum number of one dimensional cells for loop calculation in one
processor
12.2.3 Making an Executable
Creating the source files and compiling the code is relatively easy once all the makesystem
files are set up.
Making an executable on Linux with Intel compiler
The steps are as follows
1. Get the compressible source code, un-compress it, and go to the source directory
~/$ tar zxvf PMBFS2.tar.gz
~/$ cd pmbfs2/src
~/pmbfs2/src$
2. Compiling the source code
~/pmbfs2/src$ make clean
~/pmbfs2/src$ make
~/pmbfs2/src$ cd ..
~/pmbfs2$
After the compiling procedure, the executable binary files will appear in the pmbfs2 direc-
tory,
~/pmbfs2$ ls
src/ doc/ vav/
pmbfs_intel.exe
post_cal.exe post_readspray.exe post_spraystat.exe
conn.01 conn.02 grid_bin.01 grid_bin.02
140 PMBFS2 User’s Manual

## 페이지 150
Chapter 12. Getting Started: Installation and Execution
config.inp spray.inp
where pmbfs_intel.exe is the executable binary file.
3. Running the serial version or parallel version of the executable file
~/pmbfs2$ pmbfs_intel.exe
~/pmbfs2$ mpirun -np 2 pmbfs_intel.exe
Making an executable under cygwin on Windows
The steps to make an executable under cygwin on Windows is similar to the above steps.
Some Fortran compiler options should be changed according to the requirement of compiler.
The parallel execution is implemented by using MPICH2 or other MPI environment on Win-
dows.
Making an executable on Windows with IDE environment
Making an executable on Windows with IDE environment is important for the source code
development. The usual tools are Compaq Visual Fortran or Visual Studio 2005 (2008) with
Intel or PGI Fortran compiler.
PMBFS2 User’s Manual 141


> ⚠️  전체 199 페이지 중 150 페이지만 추출됨 (--max-pages 제한)
