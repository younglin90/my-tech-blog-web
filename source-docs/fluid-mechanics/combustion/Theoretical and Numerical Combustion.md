# Theoretical and Numerical Combustion

> 원본: `combustion/Theoretical and Numerical Combustion.pdf` (27.7MB, 148 페이지 추출)

## 페이지 2
Contents
Preface xi
1 Conservation equations for reacting flows 1
1.1 General forms . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 1
1.1.1 Choice of primitive variables . . . . . . . . . . . . . . . . . . . . . . . . 1
1.1.2 Conservation of momentum . . . . . . . . . . . . . . . . . . . . . . . . . 13
1.1.3 Conservation of mass and species . . . . . . . . . . . . . . . . . . . . . . 13
1.1.4 Diffusion velocities: full equations and approximations . . . . . . . . . . 14
1.1.5 Conservation of energy . . . . . . . . . . . . . . . . . . . . . . . . . . . . 17
1.2 Usual simplified forms . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 22
1.2.1 Constant pressure flames . . . . . . . . . . . . . . . . . . . . . . . . . . 22
1.2.2 Equal heat capacities for all species . . . . . . . . . . . . . . . . . . . . 23
1.2.3 Constant heat capacity for the mixture only . . . . . . . . . . . . . . . . 24
1.3 Summary of conservation equations . . . . . . . . . . . . . . . . . . . . . . . . . 25
2 Laminar premixed flames 27
2.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 27
2.2 Conservation equations and numerical solutions . . . . . . . . . . . . . . . . . . 28
2.3 Steady one-dimensional laminar premixed flames . . . . . . . . . . . . . . . . . 30
2.3.1 One-dimensional flame codes . . . . . . . . . . . . . . . . . . . . . . . . 30
2.3.2 Sensitivity analysis . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 32
2.4 Theoretical solutions for laminar premixed flames . . . . . . . . . . . . . . . . . 35
2.4.1 Derivation of one-step chemistry conservation equations . . . . . . . . . 35
2.4.2 Thermochemistry and chemical rates . . . . . . . . . . . . . . . . . . . . 37
2.4.3 The equivalence of temperature and fuel mass fraction . . . . . . . . . 40
2.4.4 The reaction rate . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 41
2.4.5 Analytical solutions for flame speed . . . . . . . . . . . . . . . . . . . . 44
2.4.6 Generalized expression for flame speeds . . . . . . . . . . . . . . . . . . 51
2.4.7 Single step chemistry limitations and stiffness of reduced
schemes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 54
2.4.8 Variations of flame speed with temperature and pressure. . . . . . . . . 55
iii

## 페이지 3
iv CONTENTS
2.5 Premixed flame thicknesses . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
2.5.1 Simple chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 56
2.5.2 Complex chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 58
2.6 Flame stretch . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 59
2.6.1 Definition and expressions of stretch . . . . . . . . . . . . . . . . . . . . 59
2.6.2 Stretch of stationary flames . . . . . . . . . . . . . . . . . . . . . . . . . 62
2.6.3 Examples of flames with zero stretch . . . . . . . . . . . . . . . . . . . . 62
2.6.4 Examples of stretched flames . . . . . . . . . . . . . . . . . . . . . . . . 63
2.7 Flame speeds . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 66
2.7.1 Flame speed definitions . . . . . . . . . . . . . . . . . . . . . . . . . . . 66
2.7.2 Flame speeds of laminar planar unstretched flames . . . . . . . . . . . . 68
2.7.3 Flame speeds of stretched flames . . . . . . . . . . . . . . . . . . . . . . 70
2.8 Instabilities of laminar flame fronts . . . . . . . . . . . . . . . . . . . . . . . . . 79
3 Laminar diffusion flames 81
3.1 Diffusion flame configurations . . . . . . . . . . . . . . . . . . . . . . . . . . . . 81
3.2 Theoretical tools for diffusion flames . . . . . . . . . . . . . . . . . . . . . . . . 83
3.2.1 Passive scalars and mixture fraction . . . . . . . . . . . . . . . . . . . . 84
3.2.2 Flame structure in the z-space . . . . . . . . . . . . . . . . . . . . . . . 86
3.2.3 The steady flamelet assumption . . . . . . . . . . . . . . . . . . . . . . . 88
3.2.4 Decomposition into mixing and flame structure problems . . . . . . . . 89
3.2.5 Models for diffusion flame structures . . . . . . . . . . . . . . . . . . . . 89
3.3 Flame structure for irreversible infinitely fast chemistry . . . . . . . . . . . . . 93
3.3.1 The Burke-Schumann flame structure . . . . . . . . . . . . . . . . . . . 93
3.3.2 Maximum local flame temperature in a diffusion flame . . . . . . . . . . 95
3.3.3 Maximum flame temperature in diffusion and premixed flames . . . . . 96
3.3.4 Maximum and mean temperatures in diffusion burners . . . . . . . . . . 96
3.4 Full solutions for irreversible fast chemistry flames . . . . . . . . . . . . . . . . 99
3.4.1 Unsteadyunstrainedone-dimensionaldiffusionflamewithinfinitelyfast
chemistry and constant density . . . . . . . . . . . . . . . . . . . . . . . 99
3.4.2 Steadystrainedone-dimensionaldiffusionflamewithinfinitelyfastchem-
istry and constant density . . . . . . . . . . . . . . . . . . . . . . . . . . 103
3.4.3 Unsteady strained one-dimensional diffusion flame with infinitely fast
chemistry and constant density . . . . . . . . . . . . . . . . . . . . . . . 106
3.4.4 Jet flame in an uniform flow field . . . . . . . . . . . . . . . . . . . . . . 109
3.4.5 Extensions to variable density . . . . . . . . . . . . . . . . . . . . . . . 111
3.5 Extensions of theory to other flame structures . . . . . . . . . . . . . . . . . . . 112
3.5.1 Reversible equilibrium chemistry . . . . . . . . . . . . . . . . . . . . . . 112
3.5.2 Finite rate chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 112
3.5.3 Summary of flame structures . . . . . . . . . . . . . . . . . . . . . . . . 116
3.5.4 Extensions to variable Lewis numbers . . . . . . . . . . . . . . . . . . . 116
3.6 Real laminar diffusion flames . . . . . . . . . . . . . . . . . . . . . . . . . . . . 118

## 페이지 4
CONTENTS v
3.6.1 One-dimensional codes for laminar diffusion flames . . . . . . . . . . . . 118
3.6.2 Mixture fractions in real flames . . . . . . . . . . . . . . . . . . . . . . . 118
4 Introduction to turbulent combustion 125
4.1 Interaction between flames and turbulence . . . . . . . . . . . . . . . . . . . . . 125
4.2 Elementary descriptions of turbulence . . . . . . . . . . . . . . . . . . . . . . . 126
4.3 Influence of turbulence on combustion . . . . . . . . . . . . . . . . . . . . . . . 130
4.3.1 One-dimensional turbulent premixed flame . . . . . . . . . . . . . . . . 130
4.3.2 Turbulent jet diffusion flame . . . . . . . . . . . . . . . . . . . . . . . . 131
4.4 Computational approaches for turbulent combustion . . . . . . . . . . . . . . . 132
4.5 RANS simulations for turbulent combustion . . . . . . . . . . . . . . . . . . . . 140
4.5.1 Averaging the balance equations . . . . . . . . . . . . . . . . . . . . . . 140
4.5.2 Unclosed terms in Favre averaged balance equations . . . . . . . . . . . 142
4.5.3 Classical turbulence models for the Reynolds stresses . . . . . . . . . . . 143
4.5.4 A first attempt to close mean reaction rates . . . . . . . . . . . . . . . . 146
4.5.5 Physical approaches to model turbulent combustion . . . . . . . . . . . 148
4.5.6 A challenge for turbulent combustion modeling: flame flapping and in-
termittency . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 149
4.6 Direct numerical simulations . . . . . . . . . . . . . . . . . . . . . . . . . . . . 152
4.6.1 The role of DNS in turbulent combustion studies . . . . . . . . . . . . . 153
4.6.2 Numerical methods for direct simulation . . . . . . . . . . . . . . . . . . 153
4.6.3 Spatial resolution and physical scales . . . . . . . . . . . . . . . . . . . . 159
4.7 Large eddy simulations . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 162
4.7.1 LES filters. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 162
4.7.2 Filtered balance equations . . . . . . . . . . . . . . . . . . . . . . . . . . 164
4.7.3 Unresolved fluxes modeling . . . . . . . . . . . . . . . . . . . . . . . . . 165
4.7.4 Simple filtered reaction rate closures . . . . . . . . . . . . . . . . . . . . 169
4.7.5 Dynamic modeling in turbulent combustion . . . . . . . . . . . . . . . . 171
4.7.6 Limits of large eddy simulations . . . . . . . . . . . . . . . . . . . . . . 172
4.7.7 Comparing large eddy simulations and experimental data . . . . . . . . 173
4.8 Chemistry for turbulent combustion . . . . . . . . . . . . . . . . . . . . . . . . 177
4.8.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177
4.8.2 Global schemes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177
4.8.3 Automatic reduction - Tabulated chemistries . . . . . . . . . . . . . . . 180
4.8.4 In situ adaptive tabulation (ISAT) . . . . . . . . . . . . . . . . . . . . . 181
5 Turbulent premixed flames 183
5.1 Phenomenological description . . . . . . . . . . . . . . . . . . . . . . . . . . . . 183
5.1.1 The effect of turbulence on flame fronts: wrinkling . . . . . . . . . . . . 183
5.1.2 The effect of flame fronts on turbulence . . . . . . . . . . . . . . . . . . 186
5.1.3 The infinitely thin flame front limit. . . . . . . . . . . . . . . . . . . . . 189
5.2 Premixed turbulent combustion regimes . . . . . . . . . . . . . . . . . . . . . . 196

## 페이지 5
vi CONTENTS
5.2.1 A first difficulty: defining u0 . . . . . . . . . . . . . . . . . . . . . . . . 196
5.2.2 Classical turbulent premixed combustion diagrams . . . . . . . . . . . . 197
5.2.3 Modified combustion diagrams . . . . . . . . . . . . . . . . . . . . . . . 200
5.3 RANS of turbulent premixed flames . . . . . . . . . . . . . . . . . . . . . . . . 214
5.3.1 Premixed turbulent combustion with single one-step chemistry . . . . . 214
5.3.2 The “no-model” or Arrhenius approach . . . . . . . . . . . . . . . . . . 216
5.3.3 The Eddy Break Up (EBU) model . . . . . . . . . . . . . . . . . . . . . 216
5.3.4 Models based on turbulent flame speed correlations. . . . . . . . . . . . 218
5.3.5 The Bray Moss Libby (BML) model . . . . . . . . . . . . . . . . . . . . 219
5.3.6 Flame surface density models . . . . . . . . . . . . . . . . . . . . . . . . 224
5.3.7 Probability density function (pdf) models . . . . . . . . . . . . . . . . . 233
5.3.8 Modeling of turbulent scalar transport terms ρug00Θ00 . . . . . . . . . . . 239
i
5.3.9 Modeling of the characteristic turbulent flame time . . . . . . . . . . . . 243
5.3.10 Kolmogorov-Petrovski-Piskunov (KPP) analysis . . . . . . . . . . . . . 246
5.3.11 Flame stabilization . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 248
5.4 LES of turbulent premixed flames. . . . . . . . . . . . . . . . . . . . . . . . . . 252
5.4.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 252
5.4.2 Extension of RANS models: the LES-EBU model . . . . . . . . . . . . . 253
5.4.3 Artificially thickened flames . . . . . . . . . . . . . . . . . . . . . . . . . 253
5.4.4 G-equation . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 255
5.4.5 Flame surface density LES formulations . . . . . . . . . . . . . . . . . . 257
5.4.6 Scalar fluxes modeling in LES . . . . . . . . . . . . . . . . . . . . . . . . 258
5.5 DNS of turbulent premixed flames . . . . . . . . . . . . . . . . . . . . . . . . . 262
5.5.1 The role of DNS in turbulent combustion studies . . . . . . . . . . . . . 262
5.5.2 DNS database analysis . . . . . . . . . . . . . . . . . . . . . . . . . . . . 263
5.5.3 Studies of local flame structures using DNS . . . . . . . . . . . . . . . . 267
5.5.4 Complex chemistry simulations . . . . . . . . . . . . . . . . . . . . . . . 273
5.5.5 Studying the global structure of turbulent flames with DNS . . . . . . . 276
5.5.6 DNS analysis for large eddy simulations . . . . . . . . . . . . . . . . . . 285
6 Turbulent non-premixed flames 287
6.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 287
6.2 Phenomenological description . . . . . . . . . . . . . . . . . . . . . . . . . . . . 288
6.2.1 Typical flame structure: jet flame. . . . . . . . . . . . . . . . . . . . . . 288
6.2.2 Specific features of turbulent non-premixed flames . . . . . . . . . . . . 288
6.2.3 Turbulent non-premixed flame stabilization . . . . . . . . . . . . . . . . 289
6.2.4 An example of turbulent non-premixed flame stabilization . . . . . . . . 297
6.3 Turbulent non-premixed combustion regimes . . . . . . . . . . . . . . . . . . . 300
6.3.1 Flame/vortex interactions in DNS . . . . . . . . . . . . . . . . . . . . . 301
6.3.2 Scales in turbulent non-premixed combustion . . . . . . . . . . . . . . . 306
6.3.3 Combustion regimes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 309
6.4 RANS of turbulent non-premixed flames . . . . . . . . . . . . . . . . . . . . . . 311

## 페이지 6
CONTENTS vii
6.4.1 Assumptions and averaged equations . . . . . . . . . . . . . . . . . . . . 311
6.4.2 Models for primitive variables with infinitely fast chemistry . . . . . . . 314
6.4.3 Mixture fraction variance and scalar dissipation rate . . . . . . . . . . . 317
6.4.4 Models for mean reaction rate with infinitely fast chemistry . . . . . . . 320
6.4.5 Models for primitive variables with finite rate chemistry . . . . . . . . . 321
6.4.6 Models for mean reaction rate with finite rate chemistry . . . . . . . . . 327
6.5 LES of turbulent non-premixed flames . . . . . . . . . . . . . . . . . . . . . . . 333
6.5.1 Linear Eddy Model . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 333
6.5.2 Infinitely fast chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . 334
6.5.3 Finite rate chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 335
6.6 DNS of turbulent non-premixed flames . . . . . . . . . . . . . . . . . . . . . . . 337
6.6.1 Studies of local flame structure . . . . . . . . . . . . . . . . . . . . . . . 337
6.6.2 Autoignition of a turbulent non-premixed flame . . . . . . . . . . . . . . 341
6.6.3 Studies of global flame structure . . . . . . . . . . . . . . . . . . . . . . 343
6.6.4 Three-dimensional turbulent hydrogen jet lifted flame with complex
chemistry . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 346
7 Flame/wall interactions 349
7.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 349
7.2 Flame–wall interaction in laminar flows . . . . . . . . . . . . . . . . . . . . . . 352
7.2.1 Phenomenological description . . . . . . . . . . . . . . . . . . . . . . . . 352
7.2.2 Simple chemistry flame/wall interaction . . . . . . . . . . . . . . . . . . 355
7.2.3 Computing complex chemistry flame/wall interaction. . . . . . . . . . . 356
7.3 Flame/wall interaction in turbulent flows . . . . . . . . . . . . . . . . . . . . . 359
7.3.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 359
7.3.2 DNS of turbulent flame/wall interaction . . . . . . . . . . . . . . . . . . 360
7.3.3 Flame/wall interaction and turbulent combustion models . . . . . . . . 364
7.3.4 Flame/wall interaction and wall heat transfer models. . . . . . . . . . . 365
8 Flame/acoustics interactions 375
8.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 375
8.2 Acoustics for non-reacting flows . . . . . . . . . . . . . . . . . . . . . . . . . . . 376
8.2.1 Fundamental equations . . . . . . . . . . . . . . . . . . . . . . . . . . . 376
8.2.2 Plane waves in one dimension . . . . . . . . . . . . . . . . . . . . . . . . 378
8.2.3 Harmonic waves and guided waves . . . . . . . . . . . . . . . . . . . . . 380
8.2.4 Longitudinal modes in constant cross section ducts . . . . . . . . . . . . 382
8.2.5 Longitudinal modes in variable cross section ducts . . . . . . . . . . . . 383
8.2.6 Longitudinal/transverse modes in rectangular ducts . . . . . . . . . . . 384
8.2.7 Longitudinal modes in a series of constant cross section ducts . . . . . . 387
8.2.8 The double duct and the Helmholtz resonator . . . . . . . . . . . . . . . 390
8.2.9 Multidimensional acoustic modes in cavities . . . . . . . . . . . . . . . . 393
8.2.10 Acoustic energy density and flux . . . . . . . . . . . . . . . . . . . . . . 395

## 페이지 7
viii CONTENTS
8.3 Acoustics for reacting flows . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 398
8.3.1 An equation for ln(P) in reacting flows . . . . . . . . . . . . . . . . . . 398
8.3.2 A wave equation in low Mach-number reacting flows . . . . . . . . . . . 399
8.3.3 Acoustic velocity and pressure in low-speed reacting flows . . . . . . . . 400
8.3.4 Acoustic jump conditions for thin flames . . . . . . . . . . . . . . . . . . 401
8.3.5 Longitudinal modes in a series of ducts with combustion . . . . . . . . . 403
8.3.6 Three-dimensional Helmholtz tools . . . . . . . . . . . . . . . . . . . . . 404
8.3.7 The acoustic energy balance in reacting flows . . . . . . . . . . . . . . . 407
8.3.8 About energies in reacting flows . . . . . . . . . . . . . . . . . . . . . . 410
8.4 Combustion instabilities . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 413
8.4.1 Stable versus unstable combustion . . . . . . . . . . . . . . . . . . . . . 414
8.4.2 Interaction of longitudinal waves and thin flames . . . . . . . . . . . . . 415
8.4.3 The (n−τ) formulation for flame transfer function . . . . . . . . . . . . 416
8.4.4 Complete solution in a simplified case . . . . . . . . . . . . . . . . . . . 417
8.4.5 Vortices in combustion instabilities . . . . . . . . . . . . . . . . . . . . . 421
8.5 Large eddy simulations of combustion instabilities . . . . . . . . . . . . . . . . 424
8.5.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 426
8.5.2 LES strategies to study combustion instabilities. . . . . . . . . . . . . . 428
9 Boundary conditions 431
9.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 431
9.2 Classification of compressible Navier-Stokes equations formulations . . . . . . . 433
9.3 Description of characteristic boundary conditions . . . . . . . . . . . . . . . . 434
9.3.1 Theory . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 434
9.3.2 Reacting Navier-Stokes equations near a boundary . . . . . . . . . . . . 436
9.3.3 The Local One Dimensional Inviscid (LODI) relations . . . . . . . . . . 440
9.3.4 The NSCBC strategy for the Euler equations . . . . . . . . . . . . . . . 442
9.3.5 The NSCBC strategy for Navier-Stokes equations . . . . . . . . . . . . . 444
9.3.6 Edges and corners . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 447
9.4 Examples of implementation. . . . . . . . . . . . . . . . . . . . . . . . . . . . . 447
9.4.1 A subsonic inflow with fixed velocities and temperature (SI-1). . . . . . 448
9.4.2 A subsonic non-reflecting inflow (SI-4) . . . . . . . . . . . . . . . . . . . 449
9.4.3 Subsonic non-reflecting outflows (B2 and B3) . . . . . . . . . . . . . . . 449
9.4.4 A subsonic reflecting outflow (B4) . . . . . . . . . . . . . . . . . . . . . 451
9.4.5 An isothermal no-slip wall (NSW) . . . . . . . . . . . . . . . . . . . . . 451
9.4.6 An adiabatic slip wall (ASW) . . . . . . . . . . . . . . . . . . . . . . . . 452
9.5 Applications to steady non-reacting flows . . . . . . . . . . . . . . . . . . . . . 452
9.6 Applications to steady reacting flows . . . . . . . . . . . . . . . . . . . . . . . . 456
9.7 Unsteady flows and numerical waves control . . . . . . . . . . . . . . . . . . . . 459
9.7.1 Physical and numerical waves . . . . . . . . . . . . . . . . . . . . . . . . 459
9.7.2 Vortex/boundary interactions . . . . . . . . . . . . . . . . . . . . . . . . 463
9.8 Applications to low Reynolds number flows . . . . . . . . . . . . . . . . . . . . 466

## 페이지 8
CONTENTS ix
10 Examples of LES applications 473
10.1 Introduction . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 473
10.2 Case 1: small scale gas turbine burner . . . . . . . . . . . . . . . . . . . . . . . 474
10.2.1 Configuration and boundary conditions . . . . . . . . . . . . . . . . . . 474
10.2.2 Non reacting flow . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 475
10.2.3 Stable reacting flow . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 480
10.3 Case 2: large-scale gas turbine burner . . . . . . . . . . . . . . . . . . . . . . . 484
10.3.1 Configuration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 484
10.3.2 Boundary conditions . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 484
10.3.3 Comparison of cold and hot flow structures . . . . . . . . . . . . . . . . 485
10.3.4 A low-frequency forced mode . . . . . . . . . . . . . . . . . . . . . . . . 486
10.3.5 A high-frequency self-excited mode . . . . . . . . . . . . . . . . . . . . . 489
10.4 Case 3: self-excited laboratory-scale burner . . . . . . . . . . . . . . . . . . . . 491
10.4.1 Configuration . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 491
10.4.2 Stable flow . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 492
10.4.3 Controlling oscillations through boundary conditions . . . . . . . . . . . 492
References 497
Index 519

## 페이지 9
x CONTENTS

## 페이지 10
Preface
Since its initial publication in 2001, many readers have commented that Theoretical and Nu-
merical Combustion is useful in that it provides a coherent summary of research in a field
where advances occur rapidly, especially in the area of numerical simulation. This Second
Edition recognizes the research advances of the past four years. In addition, however, we ac-
knowledge that the fast pace of research makes teaching combustion difficult, especially when
the numerous prerequisites required to grasp the essence of modern combustion science are
considered. Therefore, our two primary objectives in preparing this Second Edition were:
• to capture the most recent advances in combustion studies so that students and re-
searchers alike can (hopefully) find the most essential information in this text; and
• tosimplify,asmuchaspossible,acomplexsubjectsoastoprovideareasonablestarting
point for combustion beginners, especially those involved in numerical simulations.
Obviously, numerical techniques for combustion are essential tools for both engineers and
researchspecialists. Alongwithmanyofourcolleagues,westronglybelievethatthisevolution
toward more simulations is dangerous if it is not accompanied by a minimum expertise in
combustion theory. Obtaining expertise in combustion theory and modeling is much more
difficult than simply being able to run ”off-the-shelf” codes for combustion. Yet, considering
theenormousstakesassociatedwiththedesignofcombustiondevicesintermsofbotheconomy
andhumansafety,itisimperativethatthisdeepunderstandingnotbeshortcut. Weimploreall
membersofthecombustioncommunitytostrivetoensurethatthecapabilitiesandlimitations
of numerical simulations are well understood. We would like this book to continue to be one
of the tools available to achieve this understanding. To accomplish this we have maintained
our presentation of the basic combustion theories, and have sought to establish necessary
connections and interrelationships in a logical and comprehensible way.
A major evolution of numerical combustion of the past few years is the development of
methods and tools to study unsteady reacting flows. Two combined influences explain this
trend; namely,
• Many of the present challenges in the combustion industry are due to intrinsically un-
steady mechanisms: autoignition or cycle-to-cycle variations in piston engines, ignition
of rocket engines, combustion instabilities in industrial furnaces and gas turbines, and
xi

## 페이지 11
xii PREFACE
flash-back and ignition in aero gas turbines. All these problems can be studied numeri-
cally, thus partially explaining the rapid growth of the field.
• Even for stationary combustion, research on classical turbulent combustion models
(herein called RANS for Reynolds Averaged Navier Stokes) is being replaced by new
unsteady approaches (herein called LES for Large Eddy Simulations) because comput-
ers allow for the computation of the unsteady motions of the flames. However, these
new unsteady methods also raise new problems: for example, how are numerical results
compared with experimental data, and what explains the deviations?
Major changes in the Second Edition actually reflect these evolutionary influences: the
chapters on turbulent combustion and modeling (Chapters 4 through 6) incorporate recent
advances in unsteady simulation methods. Chapter 8 has also been extensively modified to
describecombustion/acousticsinteraction. Chapter10, anentirelynewchapter,isdevotedto
important examples of LES which illustrate the present state of the art in numerical combus-
tion while discussing the specificities of swirled flows.
This book can be read with no previous knowledge of combustion, but it cannot re-
place many existing books on combustion (Kuo285, Lewis and Von Elbe304, Williams554,
Glassman193, Linan and Williams315, Borghi and Destriau51, Peters398) and numerical com-
bustion (Oran and Boris383). We concentrate on what is not in these books: i.e. giving to
readers who know about fluid mechanics all the information necessary to move on to a solid
understanding of numerical combustion. We also avoid concentrating on numerical methods
for fluid mechanics. Information on Computational Fluid Dynamics (CFD) may be found in
Roache448, Anderson8, Hirsch227, Oran and Boris383, Ferziger and Peri´c167 or Sengupta477.
This text concentrates on which equations to solve and not on how to solve them.
Two important topics are also absent from the present edition:
• The presentation is limited to deflagrations, i.e. to flames with low speed. Detonations
constitute a different numerical challenge which is not considered here (see Oran and
Boris383).
• The chemistry of combustion is also a topic which requires a book (or many) in itself.
This text does not try to address this issue: the construction of chemical schemes and
their reduction and validation are not discussed here. The impact of chemical schemes
on reacting flow computations, however, is discussed; especially in the field of turbulent
combustion. Recentprogressinthisfield,bothatthefundamentallevelandforpractical
applications, has changed the way industrial combustion systems are being designed
today. Theimportantnumericaltoolsneededtounderstandthisevolutionarepresented.
The Second Edition is now organized as follows:
• Chapter 1 first describes the conservation equations needed for reacting flows and re-
views different issues which are specific to the numerical resolution of the Navier Stokes
equations for a multi-species reacting flow. Tables summarizing the main conservation

## 페이지 12
PREFACE xiii
forms used in numerical combustion codes are provided. Specific difficulties associated
with reacting flows are also discussed: models for diffusion velocities, possible simpli-
fications for low-speed flames and simple chemistry approximations. Compared to the
previous edition, the discussion about diffusion velocities was revised, clearly stating
exact formulations and usual approximations (§1.1.4).
• Chapter 2 provides a short description of numerical methods for laminar premixed
flames. It also includes a summary of many significant theoretical results which are
useful for numerical combustion. Most of these results come from asymptotic theory.
They are given here to not only provide an understanding of the results and limitations
of numerical combustion codes, but also to provide insight into how to initialize them,
determine necessary grid resolutions, and to verify their results. Extended definitions
and examples of flame speeds, flame thicknesses and flame stretch are discussed.
• Chapter 3 introduces laminar diffusion flames and two specific concepts associated with
such flames: mixture fraction and scalar dissipation. Asymptotic results and the struc-
ture of the “ideal” diffusion flame are used to provide an accurate picture of the phe-
nomenology of these flames before computation.
• Chapter4introducesthebasicconceptsusedtostudyturbulentcombustion. Elementary
concepts of turbulence and flame/turbulence interaction are described. Averaging and
filtering procedures are discussed. A classification of the different methods (RANS:
ReynoldsAveragedNavierStokes,LES:LargeEddySimulation,DNS:DirectNumerical
Simulation) used in numerical combustion for turbulent flames is given. New sections
havebeenaddedtodiscusstheincorporationofcomplexchemistryfeaturesinturbulent
flame computations (§4.8), the classification of physical approaches to model turbulent
combustionphenomenaaccordingtorecentpapers(§4.5.5),andthecomparisonbetween
LES and experimental data (§4.7.7).
• Chapter5presentsturbulentpremixedflames. Afteradescriptionofthemainphenom-
ena characterizing these flames, a review of recent results and theories is presented for
RANS, LES and DNS approaches. Implications for turbulent combustion computations
are discussed. The close relations between all numerical techniques used in the last ten
years (especially DNS results used to develop RANS or LES models) are emphasized.
• Chapter6presentsturbulentdiffusionflames. Theseflamespresentevenmorecomplex-
itiesthanpremixedflamesandnumericalinvestigationshaverecentlyhelpedtouncover
manyoftheirspecificities. Modelsarealsoverydiverse. Thetopologyofdiffusionflames
is first described and RANS methods used for turbulent non premixed combustion are
classifiedforCFDusers. RecentadvancesinthefieldofLESandDNSarealsodescribed.
• Chapter7addressestheproblemofflame/wallinteraction. Thisissueiscriticalinmany
combustion codes. Asymptotic results and DNS studies are used to illustrate the main
characteristics of this interaction. Models including this interaction in RANS codes are

## 페이지 13
xiv PREFACE
described. Since the presence of a flame strongly modifies the turbulence as well as the
densityandtheviscositynearwalls,modelsforwallfrictionandheattransferinreacting
flows are also discussed.
• Chapter 8 describes a series of theoretical and numerical tools used to study the cou-
pling phenomena between combustion and acoustics. This coupling is the source of
not only noise, but also of combustion instabilities which can significantly modify the
performances of combustors and sometimes lead to their destruction. Basic elements of
acoustics in non reacting flows are described before extending acoustic theory to react-
ing flows. This chapter then focuses on three numerical tools for combustion instability
studies: (1) one-dimensional acoustic models to predict the global behavior of a full
combustion system submitted to longitudinal waves, (2) three-dimensional Helmholtz
codes to identify possible acoustic modes in a burner and (3) multi-dimensional Large
Eddy Simulation codes to investigate the detailed response of the combustion chamber
itself which is a critical building block for acoustic models. Examples of applications
with complex geometries are provided in Chapter 10.
• Chapter 9 presents recent techniques to specify boundary conditions for compressible
viscous reacting flows. Modern simulation techniques (LES or DNS) as well as recent
applications of CFD (such as combustion instabilities described in Chapter 8) require
elaborate boundary conditions to handle unsteady combustion and acoustic waves as
well as to adjust for numerical schemes which do not provide large levels of dissipation.
This chapter provides an overview of such methods and offers a list of test cases for
steady and unsteady flows which can be used in any code.
• The new Chapter 10 describes three very recent applications of large eddy simulations
to complex-geometry swirled combustors both to predict the mean flow structure and
to analyze unsteady hydrodynamic and acoustic phenomena. These examples provide
informationontheflowphysicsofthesecombustorswhilealsodemonstratinghowrecent
numerical tools can be applied today.
To assist the reader, this book uses two distinctive pedagogical devices throughout. First,
fundamental and frequently used formulae are boxed for easy identification. Second, an in-
novative citation system has been adopted to provide rapid access to a comprehensive set of
references. In addition, unsteady flow animations are available on the web to simplify the
description of certain unsteady phenomena in Chapter 10.
Thierry POINSOT Denis VEYNANTE
Institut de M´ecanique des Fluides Laboratoire E.M2.C.
UMR CNRS/INP/UPS 5502 UPR CNRS 288
Institut National Polytechnique Ecole Centrale Paris
de Toulouse/ENSEEIHT

## 페이지 14
Chapter 1
Conservation equations for
reacting flows
1.1 General forms
This section presents the conservation equations for reacting flows and highlights the three
main differences between these equations and the usual Navier-Stokes equations for non-
reacting cases:
• a reacting gas is a non-isothermal mixture of multiple species (hydrocarbons, oxygen,
water, carbon dioxyde, etc.) which must be tracked individually. Thermodynamic
data are also more complex than in classical aerodynamics because heat capacities in a
reacting gas change significantly with temperature and composition,
• speciesreactchemicallyandtherateatwhichthesereactionstakeplacerequiresspecific
modeling,
• since the gas is a mixture of gases, transport coefficients (heat diffusivity, species diffu-
sion, viscosity, etc.) require specific attention.
The derivation of these equations from mass, species or energy balances may be found
in such standard books as those by Williams554, Kuo285 or Candel78. This chapter concen-
trates on the various forms used in combustion codes and on their implications for numerical
techniques.
1.1.1 Choice of primitive variables
Combustion involves multiple species reacting through multiple chemical reactions. The
Navier-Stokes equations apply for such a multi-species multi-reaction gas but they require
some additional terms.
1

## 페이지 15
2 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
First, species are characterized through their mass fractions Y for k =1 to N where N is
k
the number of species in the reacting mixture. The mass fractions Y are defined by:
k
Y =m /m (1.1)
k k
where m is the mass of species k present in a given volume V and m is the total mass of gas
k
inthisvolume. Theprimitivevariablesforathree-dimensionalcompressiblereactingfloware:
• the density ρ=m/V,
• the three dimensional velocity field u ,
i
• one variable for energy (or pressure or enthalpy or temperature T),
• and the mass fractions Y of the N reacting species.
k
GoingfromnonreactingflowtocombustionrequiressolvingforN+5variablesinsteadof
5. Knowing that most chemical schemes involve a large number of species (N is larger than
50 for most simple hydrocarbon fuels), this is the first significant effort needed to compute
reacting flows: increase the number of conservation equations to solve.
Thermochemistry
For a mixture of N perfect gases, total pressure is the sum of partial pressures:
N
X R
p= p where p =ρ T (1.2)
k k kW
k
k=1
where T is the temperature, R=8.314J/(moleK) is the perfect gas constant, ρ =ρY and
k K
W are respectively the density and the atomic weight of species k. Since the density ρ of the
k
multi-species gas is:
N
X
ρ= ρ (1.3)
k
k=1
the state equation is:
R
p=ρ T (1.4)
W
where W is the mean molecular weight of the the mixture given by:
N
1 = X Y k (1.5)
W W
k
k=1
Mass fractions are used in most combustion codes, but other quantities are also commonly
introduced to measure concentrations of species (see Table 1.1):

## 페이지 16
1.1. GENERAL FORMS 3
• the mole fraction X is the ratio of the number of moles of species k in a volume V to
k
the total number of moles in the same volume.
• the molar concentration [X ] is the number of moles of species k per unit volume. It is
k
the quantity used to evaluate kinetic rates of chemical reactions (see Eq. (1.24)).
Quantity Definition Useful relations
Mass fraction Y Mass of species k / Total Mass Y
k k
Mole fraction X Moles of species k / Total moles X = W Y
k k Wk k
Molar concentration [X ] Moles of species k / Unit volume [X ]=ρYk =ρXk
k k Wk W
Mean molecular weight W 1 = PN Yk and W = PN X W
W k=1 Wk k=1 k k
Table 1.1: Definitions of mass fractions, mole fractions, molar concentrations and useful relations.
For a reacting flow, there are multiple possible variables to represent energy or enthalpy:
Table 1.2 gives definitions for energy (e ), enthalpy (h ), sensible energy (e ) and sensible
k k sk
enthalpy (h ) for one species.
sk
Form Energy Enthalpy
Sensible e =
RT
C dT −RT /W h =
RT
C dT
sk T0 vk 0 k sk T0 pk
Sensible+Chemical e = e +∆ho h = h +∆ho
k sk f,k k sk f,k
Table 1.2: Enthalpy and energy forms for species k. Enthalpies and energies are related by e =
sk
h −p /ρ and e =h −p /ρ .
sk k k k k k k
The mass enthalpy of formation of species k at temperature T is written ∆ho . In
0 f,k
principle, any value could be assigned to the reference temperature T . T = 0 would have
0 0
been a logical choice (Reynolds and Perkins444) but gathering experimental information on
formation enthalpies at 0 K is difficult so that the standard reference state used to tabulate
formation enthalpies is usually set to T =298.15K.
0
In addition to the reference temperature T , a reference enthalpy (or energy) value must
0
also be chosen. This level is set up by assuming that the enthalpy h is such that:
k
Z T
h = C dT + ∆ho (1.6)
k pk f,k
T0
| {z } | {z }
sensible chemical

## 페이지 17
4 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
so that the sensible enthalpy h is zero at T = T for all substances (even though the
sk 0
enthalpyatT =T (h =∆ho )isnot). Furthermore, sensibleenergiesaredefinedtosatisfy
0 k f,k
h = e +p /ρ . This choice requires the introduction of the RT /W term in e : the
sk sk k k 0 k sk
sensibleenthalpyh iszeroatT =T butthesensibleenergye isnot: e (T )=−RT /W .i
sk 0 sk sk 0 0 k
In all these forms, energies and enthalpies are mass quantities: for example, the formation
enthalpies ∆ho are the enthalpies needed to form 1 kg of species k at the reference tem-
f,k
perature T =298.15K. These values are linked to molar values ∆ho,m (which are often the
0 f,k
values given in textbooks) by:
∆ho =∆ho,m/W (1.7)
f,k f,k k
For example, the mass formation enthalpy of CH is −4675 kJ/kg while its molar formation
4
enthalpy ∆ho,m is −74.8 kJ/mole. Table 1.3 gives reference values of ∆ho and ∆ho,m for
f,k f,k f,k
some typical fuels and products used for examples in this book.
Molecular Mass formation Molar formation
Substance weight W enthalpy ∆ho enthalpy ∆ho,m
k f,k f,k
(kg/mole) (kJ/kg) (kJ/mole)
CH 0.016 −4675 −74.8
4
C H 0.044 −2360 −103.8
3 8
C H 0.114 −1829 −208.5
8 18
CO 0.044 −8943 −393.5
2
H O 0.018 −13435 −241.8
2
O 0.032 0 0
2
H 0.002 0 0
2
N 0.028 0 0
2
Table 1.3: Formation enthalpies (gaseous substances) at T =298.15K.
0
Theheatcapacitiesatconstantpressureofspeciesk (C )aremassheatcapacitiesrelated
pk
to molar capacities Cm by C =Cm/W . For a perfect diatomic gas:
pk pk pk k
Cm =3.5R and C =3.5R/W (1.8)
pk pk k
In practice, the changes of Cm with temperature are large in combusting flows and Cm
pk pk
valuesareusuallytabulatedastemperaturefunctionsusingpolynomials(StullandProphet496,
Heywood217). Fig. 1.1 shows heat capacities Cm (divided by the perfect gas constant R) as
pk
a function of temperature. While N and H heat capacities are of the order of 3.5R at low
2 2
temperatures, they deviate rapidly from this value at high temperature.
iAnother solution would be to define e
sk
= R
T
T
0
C
vk
dT and e
k
=e
sk
+∆ho
f,k
−RT0/W
k
where ∆eo
f,k
=
∆ho
f,k
−RT0/W
k
would be a formation energy at constant volume. In this case e
sk
and h
sk
−p
k
/ρ
k
would
bedifferent. Thefinalequationsareequivalent.

## 페이지 18
1.1. GENERAL FORMS 5
The mass heat capacities C of usual gases are displayed in Fig. 1.2. CO , CO and N
pk 2 2
have very similar values of C . Water has a higher capacity (2000 to 3000 J/(kgK)) and H
pk 2
mass heat capacities are much higher (of the order of 16000 J/(kgK)).
The mass heat capacities C at constant volume are related to the C by:
vk pk
C −C =R/W (1.9)
pk vk k
For a mixture of N species, Table 1.4 summarizes the different forms used for energy and
enthalpy (eight because of the possible combinations between sensible, kinetic and chemical
parts). The enthalpy h is defined by:
N N Z T ! Z T N
X X X
h= h Y = C dT +∆ho Y = C dT + ∆ho Y (1.10)
k k pk f,k k p f,k k
k=1 k=1 T0 T0 k=1
while the energy e=h−p/ρ is given by, using Eq. (1.4), (1.5) and (1.9):
N Z T ! N Z T !
X X
e= C dT −RT/W +∆ho Y = C dT −RT /W +∆ho Y
pk k f,k k vk 0 k f,k k
k=1 T0 k=1 T0
Z T N N
X X
= C dT −RT /W + ∆ho Y = e Y (1.11)
v 0 f,k k k k
T0 k=1 k=1
Most compressible codes use the total non chemical energy (E) and enthalpy (H) forms for
non reacting flows.
Form Energy Enthalpy
Sensible e =
RT
C dT −RT /W h =
RT
C dT
s T0 v 0 s T0 p
Sensible+Chemical e = e + PN ∆ho Y h = h + PN ∆ho Y
s k=1 f,k k s k=1 f,k k
Total Chemical e = e+ 1u u h = h+ 1u u
t 2 i i t 2 i i
Total non Chemical E = e + 1u u H = h + 1u u
s 2 i i s 2 i i
Table 1.4: Enthalpy and energy forms used in conservation equations.
The heat capacity at constant pressure of the mixture, C , is:
p
N N
C = X C Y = X Cm Y k (1.12)
p pk k pkW
k
k=1 k=1

## 페이지 19
6 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
7
6
5
4
yticapac
taeh
ralom
delacS
CO2
H2O
C O
Ideal diatomic gas
H2
N2
500 1000 1500 2000 2500
Temperature (K)
Figure 1.1: ScaledmolarheatcapacitiesatconstantpressureCm/RofCO ,CO,H O,H andN .
pk 2 2 2 2
3000
2500
2000
1500
1000
yticapac
taeh
ssaM
H2O
C O
CO2
N2
500 1000 1500 2000 2500
Temperature (K)
Figure 1.2: Mass heat capacities (J/(kgK)) at constant pressure C of CO , CO, H O and N .
pk 2 2 2

## 페이지 20
1.1. GENERAL FORMS 7
Eq. (1.12) shows that the mixture heat capacity C is a function both of temperature (T)
p
and composition (Y ). It may change significantly from one point to another. However, in
k
mosthydrocarbon/airflames,thepropertiesofnitrogendominateandthemassheatcapacity
of the mixture is very close to that of nitrogen. Furthermore, this value changes only from
1000 to 1300 J/(kg K) when temperature goes from 300 K to 3000 K so that C is often
p
assumed to be constant in many theoretical approaches (§ 2 and 3) and some combustion
codes.
The heat capacity of the mixture at constant volume, C , is defined as:
v
N N
C = X C Y = X Cm Y k (1.13)
v vk k vkW
k
k=1 k=1
where the heat capacities C of individual species are obtained by: C = C −R/W for
vk vk pk k
mass values or Cm =Cm −R for molar values.
vk pk
Viscous tensor
The velocity components are called u for i=1 to 3. The viscous tensor τ is defined by:
i ij
(cid:18) (cid:19)
2 ∂u ∂u ∂u
τ =− µ kδ +µ i + j (1.14)
ij 3 ∂x ij ∂x ∂x
k j i
where p is the static pressure and µ is the dynamic viscosity. The kinematic viscosity is
ν = µ/ρ. The bulk viscosity is supposed to be zero (Kuo285). δ is the Kronecker symbol:
ij
δ =1 if i=j, 0 otherwise.
ij
Viscous and pressure tensors are often combined into the σ tensor defined by:
ij
(cid:18) (cid:19)
2 ∂u ∂u ∂u
σ =τ −pδ =−pδ − µ kδ +µ i + j (1.15)
ij ij ij ij 3 ∂x ij ∂x ∂x
k j i
Molecular transport of species and heat
The heat diffusion coefficient is called λ. The diffusion coefficient of species k in the rest of
the mixture (used in Fick’s law, see below) is called D . Diffusion processes involve binary
k
diffusion coefficients (D ) and require the resolution of a system giving diffusion velocities.
kj
This is not done in most combustion codes (Ern and Giovangigli161): solving the diffusion
problem in a multi-species gas is a problem in itself. Simplified diffusion laws (usually Fick’s
law) are used in a majority of combustion codes and this text is restricted to this case. The
D coefficients are often characterized in terms of Lewis number defined by:
k
λ D
Le = = th (1.16)
k ρC D D
p k k

## 페이지 21
8 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
where D =λ/(ρC ) is the heat diffusivity coefficient. The Lewis number Le compares the
th p k
diffusion speeds of heat and species k. Section 2.4 shows that this parameter is important
in laminar flames. Le is a local quantity but, in most gases, it changes very little from one
k
point to another. The kinetic theory of gases (Hirschfelder et al.228) shows that λ changes
roughly like T0.7, ρ like 1/T and D like T1.7 so that Le is changing only by a few percents
k k
in a flame. This property is used in § 1.1.3.
The Prandtl number, Pr, compares momentum and heat transport:
ν ρνC µC
Pr = = p = p (1.17)
λ/(ρC ) λ λ
p
The Schmidt number, Sc , compares momentum and species k molecular diffusion:
k
ν
Sc = =PrLe (1.18)
k D k
k
Soret (molecular species diffusion due to temperature gradients) and Dufour (heat flux
due to species mass fraction gradients) effects are neglected for this presentation (Ern and
Giovangigli161, Giovangigli185).
Chemical kinetics
Consider a chemical system of N species reacting through M reactions:
N N
X ν0 M *) X ν 00 M for j =1,M (1.19)
kj k kj k
k=1 k=1
where M is a symbol for species k, ν0 and ν00 are the molar stoichiometric coefficients of
k kj kj
species k in reaction j. Mass conservation enforces:
N N N
X ν0 W = X ν 00 W or X ν W =0 for j =1,M (1.20)
kj k kj k kj k
k=1 k=1 k=1
where
ν =ν 00 −ν0 (1.21)
kj kj kj
For simplicity, only mass reaction rates are used. For species k, this rate ω˙ is the sum of
k
rates ω˙ produced by all M reactions:
kj
M M
ω˙ = X ω˙ =W X ν Q with ω˙ kj =Q (1.22)
k kj k kj j W ν j
k kj
j=1 j=1
where Q is the rate of progress of reaction j.
j

## 페이지 22
1.1. GENERAL FORMS 9
Summing all reaction rates ω˙ and using Eq. (1.20), one obtains:
k
N M N !
X X X
ω˙ = Q W ν =0 (1.23)
k j k kj
k=1 j=1 k=1
showing that total mass is conserved.
The progress rate Q of reaction j is written:
j
N N
Q j =K fj Y [X k ]ν k 0 j −K rj Y [X k ]ν k 00 j (1.24)
k=1 k=1
where K and K are the forward and reverse rates of reaction j. Note that kinetic rates
fj rj
are expressed using molar concentrations [X ]=ρY /W =ρ /W (see Table 1.1).
k k k k k
The rate constants K and K constitute a central problem of combustion modeling.
fj rj
They are usually modeled using the empirical Arrhenius law:
(cid:18) (cid:19) (cid:18) (cid:19)
E T
K =A Tβjexp − j =A Tβjexp − aj (1.25)
fj fj RT fj T
Expressing the individual progress rates Q for each reaction means providing data for the
j
preexponential constant A , the temperature exponent β and the activation temperature
fj j
T (or equivalently the activation energy E = RT ). Before giving these constants, even
aj j aj
identifyingwhichspeciesandwhichreactionsshouldorshouldnotbekeptinagivenschemeis
the challenge of chemical kinetics. Describing the construction of chemical schemes and their
validation is beyond the scope of this text. In most numerical approaches for reacting flows,
the chemicalscheme is one ofthedataelementswhichmustbeavailable forthe computation.
Certain properties of the kinetics data have a crucial effect on the success of the computation
(as discussed in Section 2) so numerical combustion users cannot avoid considering the char-
acteristicsoftheseschemes. AnexampleofakineticschemeforH -O combustionproposed
2 2
by Miller et al.356 is given in Table 1.5 in standard CHEMKIN format (Kee et al.259). First,
elements and species which have been retained for the scheme are listed. For each reaction,
the table then gives A in cgs units, β and E in cal/mole. The backwards rates K are
fj j j rj
computed from the forward rates through the equilibrium constants:
K
K = fj (1.26)
rj (cid:16) p
a
(cid:17) PN
k=1
νkj
exp
∆S
j
0
−
∆H
j
0 !
RT R RT
where p = 1 bar. The ∆ symbols refer to changes occurring when passing from reactants to
a
products in the jth reaction: ∆H0 and ∆S0 are respectively enthalpy and entropy changes
j j
for reaction j. These quantities are obtained from tabulations.

## 페이지 23
10 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
ELEMENTS
H O N
END
SPECIES
H2 O2 OH O H H2O HO2 H2O2 N2
END
REACTIONS
H2+O2=OH+OH 1.700E13 0.0 47780.
H2+OH=H2O+H 1.170E09 1.30 3626.
H+O2=OH+O 5.130E16 -0.816 16507.
O+H2=OH+H 1.800E10 1.0 8826.
H+O2+M=HO2+M 2.100E18 -1.0 0.
H2/3.3/ O2/0./ N2/0./ H2O/21.0/
H+O2+O2=HO2+O2 6.700E19 -1.42 0.
H+O2+N2=HO2+N2 6.700E19 -1.42 0.
OH+HO2=H2O+O2 5.000E13 0.0 1000.
H+HO2=OH+OH 2.500E14 0.0 1900.
O+HO2=O2+OH 4.800E13 0.0 1000.
OH+OH=O+H2O 6.000E08 1.3 0.
H2+M=H+H+M 2.230E12 0.5 92600.
H2/3./ H/2./ H2O/6.0/
O2+M=O+O+M 1.850E11 0.5 95560.
H+OH+M=H2O+M 7.500E23 -2.6 0.
H2O/20.0/
HO2+H=H2+O2 2.500E13 0.0 700.
HO2+HO2=H2O2+O2 2.000E12 0.0 0.
H2O2+M=OH+OH+M 1.300E17 0.0 45500.
H2O2+H=H2+HO2 1.600E12 0.0 3800.
H2O2+OH=H2O+HO2 1.000E13 0.0 1800.
END
Table 1.5: 9 species / 19 reactions chemical scheme for H - O combustion (Miller et al.356). For
2 2
each reaction, the table provides respectively A (cgs units), β and E (cal/mole).
fj j j
At this point, for numerical combustion users, it is important to mention that data on Q
j
correspond to models: except for certain reactions, these data are obtained experimentally
and values of kinetic parameters are often disputed in the kinetics community (Just248). For
manyflames,verydifferentschemesarefoundintheliteraturewithverycomparableaccuracy
and the choice of a scheme is a difficult and controversial task. Unfortunately, the values of
the parameters used to compute Q and the stiffness associated with the determination of Q
j j
create a central difficulty for numerical combustion: the space and time scales corresponding
to the Q terms are usually very small and require meshes and time steps which can be
j
orders of magnitude smaller than in non reacting flows. Particular attention must be paid
to the activation energy E (usually measured in kcal/mole in the combustion community):
j
the exponential dependence of rates to E leads to considerable difficulties when E takes
j j
large values (typically more than 60 kcal/mole). A given combustion code for laminar flames
may work perfectly with a given mesh when E is small but will require many more points to
j
resolve the flame structure when E is increased even by a small amount (see § 2.4.4).
j

## 페이지 24
1.1. GENERAL FORMS 11
Stoichiometry in premixed flames
Eventhoughmultiple radicalsmaybeinvolvedinaflame, certainspeciesare moreimportant
tocharacterizethecombustionregime. Thefuelandtheoxidizermassfractionsareobviously
significant quantities and their ratio is commonly used to characterize the flame. There are
different ways to define the equivalence ratio (Fig. 1.3) depending on the configuration of the
burner (premixed or non premixed).
Stream 1:
Fuel
Fuel
+
Air
Stream 2:
oxidizer
(a) Premixed flame (b) Diffusion flame
Figure 1.3: Premixed and diffusion flames configurations.
In a premixed combustor (Fig. 1.3a), fuel and oxidizer are mixed before they enter the
combustion chamber. If ν0 and ν0 are the coefficients corresponding to fuel and oxidizer
F O
when considering an overall unique reaction of the type
ν0 F +ν0 O →Products (1.27)
F O
(for example CH +2O →CO +2H O), the mass fractions of fuel and oxidizer correspond
4 2 2 2
to stoichiometric conditions when:
(cid:18) Y (cid:19) ν0 W
O = O O =s (1.28)
Y ν0 W
F st F F
This ratio s is called the mass stoichiometric ratio. The equivalence ratio of a given mixture
is then:
(cid:18) (cid:19) (cid:18) (cid:19)
Y Y Y
φ=s F = F / F (1.29)
Y Y Y
O O O st
It can also be recast as:
m˙
φ=s F (1.30)
m˙
O
where m˙ and m˙ are respectively the mass flow rates of fuel and oxidizer.
F O

## 페이지 25
12 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
The equivalence ratio is a central parameter for premixed gases: rich combustion is ob-
tainedforφ>1(thefuelisinexcess)whileleanregimesareachievedwhenφ<1(theoxidizer
is in excess).
Most practical burners operate at or below stoichiometry. In hydrocarbon/air flames, the
freshgasescontainFuel,O andN withtypically3.76molesofnitrogenfor1moleofoxygen.
2 2
Since the sum of mass fractions must be unity, the fuel mass fraction is:
1
Y = (1.31)
F s (cid:18) W (cid:19)
1+ 1+3.76 N2
φ W
O2
Table 1.6 shows typical values of the stoichiometric ratio s and of corresponding fuel mass
fractions for stoichiometric mixtures (φ=1) with air.
Global reaction s Yst
F
CH +2(O +3.76N ) → CO +2H O+7.52N 4.00 0.055
4 2 2 2 2 2
C H +5(O +3.76N ) → 3CO +4H O+18.8N 3.63 0.060
3 8 2 2 2 2 2
2C H +25(O +3.76N ) → 16CO +18H O+94N 3.51 0.062
8 18 2 2 2 2 2
2H +(O +3.76N ) → 2H O+3.76N 8.00 0.028
2 2 2 2 2
Table 1.6: Stoichiometricratiosandfuelmassfractionforstoichiometriccombustion(φ=1)inair
given by Eq. (1.31).
Values of the fuel mass fraction at stoichiometry are very small (Table 1.6) so that the
premixed gas entering the chamber contains mostly air: adding fuel to air to obtain a react-
ing mixture does not significantly modify the properties of air in terms of molecular weights,
transport properties and heat capacities compared to pure air. This is used in many the-
ories of premixed flames and in certain codes to simplify the evaluation of transport and
thermodynamic properties.
Stoichiometry in diffusion flames
Foradiffusionflame,fuelandoxidizerareintroducedseparatelyintothecombustionchamber
through two (or more) inlets where flow rates and mass fractions are controlled separately.
For the combustor of Fig. 1.3b with only two inlets (one for the fuel stream with a fuel mass
fraction Y1 and the other for the oxidizer stream with an oxidizer mass fraction Y2), a first
F O
definition of equivalence ratio is:
φ=s(Y1/Y2) (1.32)
F O
This ratio characterizes the local structure of the flames formed when the two streams (fuel
and oxidizer) interact. However, it does not represent the overall behavior of the combustor

## 페이지 26
1.1. GENERAL FORMS 13
for which a global equivalence ratio φ must be introduced:
g
φ =sm˙1/m˙2 (1.33)
g F O
where m˙1 and m˙2 are the flow rates of fuel in the first inlet and of oxidizer in the second
F O
respectively. The global (φ ) and the local (φ) equivalence ratios are linked by:
g
φ =φm˙1/m˙2 (1.34)
g
where m˙1 and m˙2 are the total flow rates entering inlet 1 and 2 respectively. For premixed
combustors, fuel and oxidizer are carried by the same stream and m˙1= m˙2 so that φ = φ.
g
For non premixed systems, these two quantities may differ significantly.ii
1.1.2 Conservation of momentum
The equation of momentum is the same in reacting and non reacting flows:
N N
∂ ρu + ∂ ρu u =− ∂p + ∂τ ij +ρ X Y f = ∂σ ij +ρ X Y f (1.35)
∂t j ∂x i j ∂x ∂x k k,j ∂x k k,j
i j i i
k=1 k=1
where f is the volume force acting on species k in direction j. Even though this equation
k,j
does not include explicit reaction terms, the flow is modified by combustion: the dynamic
viscosity µ strongly changes because temperature varies in a ratio from 1:8 or 1:10. Density
also changes in the same ratio and dilatation through the flame front increases all speeds
by the same ratio. As a consequence, the local Reynolds number varies much more than in
a non reacting flow: even though the momentum equations are the same with and without
combustion, the flow behavior is very different. A typical example is found in jets: turbulent
non reacting jets may become laminar once they are ignited (Lewis and Von Elbe304).
1.1.3 Conservation of mass and species
The total mass conservation equation is unchanged compared to non reacting flows (combus-
tion does not generate mass):
∂ρ ∂ρu
+ i =0 (1.36)
∂t ∂x
i
The mass conservation equation for species k is written:
∂ρY ∂
k + (ρ(u +V )Y )=ω˙ for k =1,N (1.37)
∂t ∂x i k,i k k
i
iiThe excess air, defined by e=100(1−φg)/φg, is also used to characterize the overall mixture. It gives
thepercentageofairinexcessoftheflowraterequiredtoconsumeallthefuelinjectedintotheburner.

## 페이지 27
14 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
where V is the i- component of the diffusion velocity V of species k and ω˙ is the reaction
k,i k k
rate of species k. By definition:
N N
X X
Y V =0 and ω˙ =0 (1.38)
k k,i k
k=1 k=1
1.1.4 Diffusion velocities: full equations and approximations
The diffusion velocities V of the N species are obtained by solving the system (Williams554):
k
N N
∇X =
XX
p
X
k (V −V )+(Y −X )
∇P
+
ρX
Y Y (f −f ) for p=1,N (1.39)
p D k p p p P p p k p k
pk
k=1 k=1
where D =D is the binary mass diffusion coefficient of species p into species k and X is
pk kp k
the mole fraction of species k: X =Y W/W . The Soret effect (the diffusion of mass due to
k k k
temperature gradients) is neglected.
The system (1.39) is a linear system of size N2 which must be solved in each direction at
each point and at each instant for unsteady flows. Mathematically, this task is difficult and
costly (Ern and Giovangigli161) and most codes use simplified approaches discussed below.
Binary diffusion
If the mixture contains only two species and if pressure gradients are small and volume forces
are neglected, the system (1.39) reduces to a scalar equation where the unknown are the two
diffusion velocities V and V :
1 2
X X
∇X = 1 2 (V −V ) (1.40)
1 D 2 1
12
Knowing that Y +Y =1 and that Y V +Y V =0 from Eq. (1.38), Eq. (1.40) leads to:
1 2 1 1 2 2
V Y =−D ∇Y (1.41)
1 1 12 1
whichisFick’slaw(Kuo285). Thisexpressionisexactforbinarydiffusionbutmustbereplaced
by a more complex expression for multispecies gases.
Multispecies diffusion
Therigorousinversionofsystem(1.39)inamultispeciesgasisoftenreplacedbytheHirschfelder
and Curtiss approximation (Hirschfelder et al.228) which is the best first-order approximation
to the exact resolution of system (1.39) (Ern and Giovangigli161, Giovangigli185):
1−Y
V X =−D ∇X with D = k (1.42)
k k k k k Σ X /D
j6=k j jk

## 페이지 28
1.1. GENERAL FORMS 15
The coefficient D is not a binary diffusion but an equivalent diffusion coefficient of species
k
k into the rest of the mixture. If the mixture contains only two species labelled 1 and 2,
Eq. (1.42) reduces to V X = −(Y /X )D ∇X which is exactly Fick’s law (1.41): for a
1 1 2 2 12 1
binary mixture with no pressure gradient and no volume forces, both Fick’s law and the
Hirschfelder and Curtiss approximation are exact. In all other cases, however, Eq. (1.42)
differs from Fick’s law and leads to the following species equationiii:
(cid:18) (cid:19)
∂ρY ∂ρu Y ∂ W ∂X
k + i k = ρD k k +ω˙ (1.43)
∂t ∂x ∂x k W ∂x k
i i i
1.4
1.2
1.0
0.8
0.6
0.4
0.2
0.0
rebmun
siweL
CO2
O2
CH4
H2O
OH
H2
-2 -1 0 1 2 3 4 5
x [cm]
Figure 1.4: Variations of Lewis numbers (defined by Eq. (1.16)) of the main species in a stoichio-
metric laminar methane air flame (B. Bedat, private communication, 1999).
TheHirschfelderandCurtissapproximationfordiffusionvelocitiesisaconvenientapprox-
imation because the diffusion coefficients D can be simply linked to the heat diffusivity D
k th
inmanyflames: theLewisnumbersofindividualspeciesLe =D /D areusuallyvaryingby
k th k
smallamountsinflamefronts. Fig.1.4showsacomputationofLewisnumbersofmainspecies
forapremixedstoichiometricmethane/airflameplottedversusspatialcoordinatethroughthe
flame front. Lewis numbers change through the flame front (located here at x=0) but these
changes are small.
iiiNotetheW /W factorintheRHSdiffusiontermofEq.(1.43). Thistermismissinginformulationsusing
k
Fick’slaw(1.41). Fick’slawisstrictlyvalidforbinarydiffusiononlyandshouldnotbeusedinflames.

## 페이지 29
16 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
Global mass conservation and correction velocity
Mass conservation is a specific issue when dealing with reacting flows. Obviously, the sum of
mass fractions must be unity:
PN
Y = 1. This equation adds to the N equations (1.37)
k=1 k
while there are only N unknowns (the Y ’s): the system is over determined. It is easy to
k
check that if all species equations (1.37) are added and the identities
PN
Y V = 0 and
k=1 k k,i
PN
ω˙ =0 are used, the mass conservation equation is recovered:
k=1 k
N ! N
∂ρ + ∂ρu i =− ∂ ρ X Y V + X ω˙ =0 (1.44)
∂t ∂x ∂x k k,i k
i i
k=1 k=1
This equation shows that there are only N independent equations and that any one of the
N species equations (1.37) or the mass conservation equation (1.36) may be eliminated: this
apparent problem is not a difficulty when exact expressions for diffusion velocities are used.
However,thisisnolongerthecasewhenHirschfelder’slawisused. Inthiscase,theRHSterm
ofEq.(1.44)becomes
∂
∂
xi
(ρ PN
k=1
D
k
W
W
k∂
∂
X
xi
k)whichisnotzero: globalmassisnotconserved.
Despite this drawback, most codes in the combustion community use Hirschfelder’s law (or
even Fick’s law) because solving for the diffusion velocities is too complex. Two methods can
be used to implement such laws and still maintain global mass conservation:
• The first and simplest method is to solve the global mass conservation equation (1.36)
and only N −1 species equations. The last species mass fraction (usually a diluent
such as N ) is obtained by writing Y = 1−
PN−1Y
and absorbs all inconsistencies
2 N k=1 k
introducedbyEq.(1.42). Thissimplificationisdangerousandshouldbeusedonlywhen
flames are strongly diluted (for example in air so that Y is large).
N2
• In the second method, a correction velocity Vc is added to the convection velocity in
the species equations (1.43):
(cid:18) (cid:19)
∂ ∂ ∂ W ∂X
ρY + ρ(u +Vc)Y = ρD k k +ω˙ (1.45)
∂t k ∂x i i k ∂x k W ∂x k
i i i
ThecorrectionvelocityVc isevaluatedtoensureglobalmassconservation. Ifallspecies
i
equations are summed, the mass conservation equation must be recovered:
N ! N
∂ρ + ∂ρu i = ∂ ρ X D W k ∂X k −ρVc =0 so: Vc = X D W k ∂X k
∂t ∂x ∂x k W ∂x i i k W ∂x
i i i i
k=1 k=1
(1.46)
Ateachtimestep, thecorrectionvelocityiscomputedandaddedtotheconvectingfield
u to ensure the compatibility of species and mass conservation equations. In this case,
i
it is still possible to solve for (N-1) species and for the total mass but, unlike for the
first method, the result for Y is correct. This solution is often chosen in laminar flame
N
codes where diffusion coefficients can be very different.

## 페이지 30
1.1. GENERAL FORMS 17
1.1.5 Conservation of energy
Theenergyconservationequationrequiresthegreatestattentionbecausemultipleformsexist.
Note first that because of continuity (Eq. 1.36), the following relation (which may be used in
all left hand sides of enthalpy, energy or temperature equations) holds for any quantity f:
(cid:18) (cid:19)
Df ∂f ∂f ∂ρf ∂ρu f
ρ =ρ +u = + i (1.47)
Dt ∂t i∂x ∂t ∂x
i i
where the last form is called conservative. Starting from the conservation equation for total
energy e (Kuo285):
t
N
ρ De t = ∂ρe t + ∂ (ρu e )=− ∂q i + ∂ (σ u )+Q˙ +ρ X Y f (u +V ) (1.48)
Dt ∂t ∂x i t ∂x ∂x ij i k k,i i k,i
i i j
k=1
where Q˙ is the heat source term (due for example to an electric spark, a laser or a radiative
flux), not to be confused with the heat released by combustion. ρ
PN
Y f (u +V ) is
k=1 k k,i i k,i
the power produced by volume forces f on species k. The energy flux q is:
k i
N
∂T X
q =−λ +ρ h Y V (1.49)
i ∂x k k k,i
i
k=1
This flux includes a heat diffusion term expressed by Fourier’s Law (λ∂T/∂x ) and a second
i
term associated with the diffusion of species with different enthalpies which is specific of
multi-species gas.
Usingtherelationbetweenenergyandenthalpy: h =e +p/ρandthecontinuityequation
t t
(1.36) yields:
De Dh Dp ∂u De Dh Dp ∂u
ρ t =ρ t − −p i and ρ =ρ − −p i (1.50)
Dt Dt Dt ∂x Dt Dt Dt ∂x
i i
Using Eq. (1.50) to eliminate e in Eq. (1.48) gives the conservation equation for h :
t t
N
ρ Dh t = ∂ρh t + ∂ (ρu h )= ∂p − ∂q i + ∂ (τ u )+Q˙ +ρ X Y f (u +V ) (1.51)
Dt ∂t ∂x i t ∂t ∂x ∂x ij i k k,i i k,i
i i j
k=1
The equation for the sum of sensible and chemical energy (e) is obtained by writing first
the kinetic energy equation u u /2. Multiplying the momentum equation (1.35) by u :
j j j
(cid:18) (cid:19) (cid:18) (cid:19) N
∂ 1 ρu u + ∂ 1 ρu u u =u ∂σ ij +ρ X Y f u (1.52)
∂t 2 j j ∂x 2 i j j j ∂x k k,j j
i i
k=1

## 페이지 31
18 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
Subtracting this equation from Eq. (1.48) gives a balance equation for e:
N
ρ De = ∂ρe + ∂ (ρu e)=− ∂q i +σ ∂u i +Q˙ +ρ X Y f V (1.53)
Dt ∂t ∂x i ∂x ij∂x k k,i k,i
i i j
k=1
The conservation equation for the enthalpy h is then deduced from Eq. (1.53) and (1.50):
N
ρ Dh = ∂ρh + ∂ (ρu h)= Dp − ∂q i +τ ∂u i +Q˙ +ρ X Y f V (1.54)
Dt ∂t ∂x i Dt ∂x ij∂x k k,i k,i
i i j
k=1
where Φ=τ ∂u /∂x is the viscous heating source term.
ij i j
The above expressions are not always easy to implement in classical CFD codes because
they use expressions for energy and enthalpy including chemical terms ( PN ∆ho Y ) in
k=1 f,k k
additiontosensibleenergyorenthalpyandbecausetheheatfluxqalsoincludesnewtransport
terms (ρ
PN
h Y V ). Sensible energies or enthalpies are sometimes preferred. From the
k=1 k k k,i
definition of h (h = h− PN ∆ho Y ), substituting h for h in Eq. (1.54) and using the
s s k=1 f,k k s
species equation (1.37) leads to:
(cid:18) (cid:19) N !
ρ Dh s =ω˙ + Dp + ∂ λ ∂T − ∂ ρ X h Y V +τ ∂u i
Dt T Dt ∂x ∂x ∂x s,k k k,i ij∂x
i i i j
k=1 (1.55)
N
+ Q˙ +ρ X Y f V
k k,i k,i
k=1
where ω˙ is the heat release due to combustion:
T
N
X
ω˙ =− ∆ho ω˙ (1.56)
T f,k k
k=1
RT
The sensible enthalpies of species k, h = C dT appear on the RHS of Eq. (1.55). The
s,k T0 p,k
corresponding term ∂ (ρ PN h Y V ) is zero:
∂xi k=1 s,k k k,i
• if the mixture contains only one species or
• if all species have the same sensible enthalpy:
PN
h Y V =h
PN
Y V =0.
k=1 s,k k k,i s k=1 k k,i
In all other cases, this term does not vanish even though it is sometimes set to zero because
it is usually negligible compared to ω˙ .
T

## 페이지 32
1.1. GENERAL FORMS 19
The equation for the sensible energy e may be deduced from Eq. (1.55) and (1.50):iv
s
(cid:18) (cid:19)
De ∂ρe ∂ ∂ ∂T
ρ s = s + (ρu e )=ω˙ + λ
Dt ∂t ∂x i s T ∂x ∂x
i i i
N ! N (1.57)
− ∂ ρ X h Y V +σ ∂u i +Q˙ +ρ X Y f V
∂x s,k k k,i ij∂x k k,i k,i
i j
k=1 k=1
Another way is to work with the sum of sensible and kinetic energies (the “total non-
chemical” energy in Table 1.4). Adding Eq. (1.57) and (1.52) leads to the equation for E =
e + 1u u :
s 2 i i
(cid:18) (cid:19)
DE ∂ρE ∂ ∂ ∂T
ρ = + (ρu E)=ω˙ + λ
Dt ∂t ∂x i T ∂x ∂x
i i i
N ! N (1.58)
− ∂ ρ X h Y V + ∂ (σ u )+Q˙ +ρ X Y f (u +V )
∂x s,k k k,i ∂x ij i k k,i i k,i
i j
k=1 k=1
Inthesameway,theequationforH =h +u u /2isobtainedbyaddingEq.(1.55)and(1.52):
s i i
(cid:18) (cid:19)
DH ∂ρH ∂ ∂ ∂T
ρ = + (ρu H) = ω˙ + λ
Dt ∂t ∂x i T ∂x ∂x
i i i
N ! N (1.59)
+ ∂p − ∂ ρ X h Y V + ∂ (τ u )+Q˙ +ρ X Y f (u +V )
∂t ∂x s,k k k,i ∂x ij i k k,i i k,i
i j
k=1 k=1
Insomecodes(low-Machnumberorincompressibleformulations),anequationfortemper-
ature is used. Starting from h =
PN
h Y where h is the sensible enthalpy of species
s k=1 s,k k s,k
k (Giovangigli184, Giovangigli and Smooke186), the derivative of h is:
s
N
ρ Dh s = X h ρ DY k +ρC DT (1.60)
Dt sk Dt p Dt
k=1
wo
i
u
v
l
N
d
o
b
te
e
t
f
h
ou
at
nd
th
i
e
f
s
t
e
h
n
e
s
s
ib
en
le
si
e
b
n
l
e
e
r
e
g
n
y
e
i
r
s
g
d
y
e
i
fi
s
n
d
e
e
d
fi
h
n
e
e
r
d
e
b
b
y
y
e
e
0 s
s
=
=
R
R
T T T
T
0 0 C
C
v
v
d
d
T
T
:
−RT0/W (Table1.4). Adifferentequation
!
ρ D
D
e
t
0 s =− X N ∆eo
f,k
ω˙
k
+
∂
∂
xi
(cid:16) λ
∂
∂
x
T
i
(cid:17) −
∂
∂
xi
ρ X N (h
s,k
+RT0/W
k
)Y
k
V
k,i
+σij
∂
∂
x
u
j
i+Q˙+ρ X N Y
k
f
k,i
V
k,i
k=1 k=1 k=1
where∆eo
f,k
istheformationenergyatTO: ∆eo
f,k
=∆ho
f,k
−RT0/W
k
.

## 페이지 33
20 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
Replacing this derivative in Eq. (1.55) gives:
(cid:18) (cid:19) N !
ρC DT =ω˙0 + Dp + ∂ λ ∂T − ρ X C Y V ∂T +τ ∂u i
p Dt T Dt ∂x i ∂x i p,k k k,i ∂x i ij∂x j (1.61)
k=1
+ Q˙ +ρ PN Y f V
k=1 k k,i k,i
Notethatthereactiontermω˙0 isnotequaltoω˙ ,thereactiontermfoundintheequation
T T
for e or h :
s s
N N N N
X X X X
ω˙ =− ∆ho ω˙ ; ω˙0 =− h ω˙ =− h ω˙ − ∆ho ω˙ (1.62)
T f,k k T k k sk k f,k k
k=1 k=1 k=1 k=1
These two terms are both called heat release so that different authors use the same term
for different quantities. They differ by a small amount due to the contribution of sensible
enthalpy terms h . Section 1.2.2 shows that they are equal when the heat capacities C ’s
sk p,k
are supposed equal for all species.
An equivalent form may be written with C , starting from the definition of e to have:
v s
N
ρ De s = X e ρ DY k +ρC DT (1.63)
Dt sk Dt v Dt
k=1
so that replacing the time derivative of e in Eq. (1.57) leads to:
s
(cid:18) (cid:19) N !
DT ∂ ∂T ∂ X
ρC =ω˙00 + λ −RT ρ Y V /W
v Dt T ∂x ∂x ∂x k k,i k
i i i
k=1 (1.64)
N N
−ρ ∂T X (Y V C )+σ ∂u i +Q˙ +ρ X Y f V
∂x k k,i p,k ij∂x k k,i k,i
i j
k=1 k=1
where ω˙00 = − PN e ω˙ is another reaction rate (equal to ω˙ when all heat capacities C
T k=1 k k T pk
are equal).
Table 1.7 summarizes the different forms of energy equations.

## 페이지 34
1.1. GENERAL FORMS 21
yplahtnE
ygrenE
mroF
TR
TR
Td C = h
W/ TR− Td C =ρ/p−
h= e
elbisneS
p 0T s
0 v 0T
s s
Y oh∆ NP + h=h
Y oh∆ NP + e=ρ/p−h=e
lacimehC+elbisneS
k
k,f 1=k s
k k,f 1=k s
u
u1
+ Y oh∆ NP +
h= h u u1 + Y oh∆ NP + e=ρ/p−
h=
e
lacimehC
latoT
i
i 2
k k,f 1=k
s t i i 2 k k,f 1=k s
t
t
u u1 + h= H
u u1 + e=ρ/p− H=
E
lacimehC
non
latoT
i i 2 s
i i 2 s
) i,k V+
i u( i,k f k Y 1= N k P ρ+Q˙ +) i u ji σ( jx ∂ ∂ + i i x q∂
∂ −= t t e D Dρ
t e
) i,k V+
i u( i,k f k Y 1= N k P ρ+Q˙ +) i u ji τ( jx ∂ ∂ + i i x q∂ ∂
− p t∂ ∂ = t t h D Dρ
t h
i,k V i,k f k Y 1= N k P ρ+Q˙ + i j u x ∂ ∂ji σ+ i i x q∂ ∂ −=
e tD Dρ
e
i,k
V i,k f k Y 1= N k P ρ+Q˙ + i j u x ∂ ∂ji τ+ i i x q∂ ∂ − p tD D
= h tD Dρ
h
i,k V i,k f k Y 1= N k P ρ+Q˙
+ i j u x ∂ ∂ji σ+) i,k V k Y k,s h 1= N k P ρ( ix ∂ ∂ −)
i T x ∂ ∂ λ( ix ∂ ∂ +
T ω˙
= s t e D Dρ
s e
i,k
V i,k f k Y 1= N k P ρ+Q˙
+ i j u x ∂ ∂ji τ+) i,k V k Y k,s h 1= N k P ρ( ix ∂ ∂ −) i T x
∂ ∂ λ( ix ∂ ∂ + p tD D
+
T ω˙ =
s t h D Dρ
s h
) V+
u( f Y NP
ρ+Q˙ +) u σ( ∂ +) V Y h NP ρ(
∂ −) T∂λ(
∂
+ ω˙
= EDρ
E
i,k
i i,k k 1=k
i ji jx∂ i,k k k,s 1=k
ix∂ ix∂
ix∂
T
tD
)
V+
u( f Y NP ρ+Q˙
+) u τ( ∂ +) V Y h NP ρ( ∂
−) T∂λ( ∂
+
p∂ +
ω˙ =
HDρ
H
i,k
i i,k k 1=k
i ji jx∂ i,k k k,s 1=k ix∂
ix∂ ix∂
t∂ T
tD
ehT
.seiticolev
noisuffid eht era
V ehT .snoitauqe ecnalab gnidnopserroc
dna smrof ygrene
dna
yplahtnE
:7.1
elbaT
i,k
yb
denfied
xufl
yplahtne eht si q
.mret ecruos emulov eht si Q˙ .i noitcerid
ni k seiceps no
gnitca
secrof
emulov
era
s’
f
i
i,k
.
δp−
τ=
σ dna )ju∂ + iu∂(µ+
δku∂µ3/2−= τ yb denfied era srosnet
suocsiv ehT
.
V Y h
NP
ρ+
T∂λ−=
q
ji
ji
ji ix∂ jx∂
ji kx∂ ji
i,k
k k
1=k
ix∂
i
.)f
uρ( ∂ + fρ∂ =) f∂
u+ f∂(ρ= fDρ :f yplahtne ro ygrene yna
roF . ω˙ oh∆
NP −
si
ω˙
esaeler
taeh
ehT
i ix∂ t∂ ix∂i
t∂ tD
k k,f
1=k
T

## 페이지 35
22 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
1.2 Usual simplified forms
Thecompleteformoftheenergyequationisnotalwaysneededandsimplifiedformsareoften
utilized in combustion codes. The following sections present such forms.
1.2.1 Constant pressure flames
In deflagrations (Williams554), flame speeds are small compared to the sound speed (typical
valuesfors rangefrom0.1to5m/swhilethesoundspeedinthefreshgasesc variesbetween
L 1
300 and 600 m/s in most combustion chambers), allowing some interesting simplifications:
• The Mach number M in the flow is of the order of s /c and is small: this is sufficient
a L 1
to show that pressure in the state equation may be assumed to be constant. This may
be checked by starting from the conservation of momentum (1.35), written here for
simplicity in one dimension only with a constant viscosity µ:
∂u ∂u ∂p ∂ ∂u
ρ +ρu =− +µ (1.65)
∂t ∂x ∂x ∂x∂x
This equation may be scaled with:
u+ =u/c x+ =x/L ρ+ =ρ/ρ t+ =c t/L p+ =p/ (cid:0) ρ c2(cid:1) (1.66)
1 1 1 1 1
where L is a reference distance (for example the size of the burner) and c is the sound
1
speed. Index 1 refers to fresh gas quantities. Introducing the acoustic Reynolds number
R =ρ c L/µ , Eq. (1.65) becomes:
e 1 1 1
∂p+ ∂u+ ∂u+ 1 ∂ ∂u+
=−ρ+ −ρ+u+ + , (1.67)
∂x+ ∂t+ ∂x+ R ∂x+∂x+
e
| {z } | {z } | {z }
o(M a ) o(M a 2) o(M a /Re)
Eq. (1.67) shows that, in high Reynolds number steady flows, the changes in mean
pressure are of the order of M2. They are of the order of M in unsteady flows. For
a a
subsoniccombustionwithlowMachnumbers,thesevariationsarenegligibleandpressure
can be assumed to be constant in the state equation p = ρR/WT which is replaced by
ρR/WT = p = cte. Therefore, the density change through the flame front is directly
0
related to the temperature change through the flame front:
ρ /ρ =T /T . (1.68)
2 1 1 2
In the energy equation, the pressure term Dp/Dt may be set to zero.
• Inthesameway,theviscousheatingtermΦ=τ (∂u /∂x )inthetemperatureequation
ij i j
is of high order in M and may be neglected.
a

## 페이지 36
1.2. USUAL SIMPLIFIED FORMS 23
The temperature equation (1.61) reduces to:
(cid:18) (cid:19) N ! N
ρC DT =ω˙0 + ∂ λ ∂T −ρ ∂T X C Y V +Q˙ +ρ X Y f V (1.69)
p Dt T ∂x ∂x ∂x p,k k k,i k k,i k,i
i i i
k=1 k=1
1.2.2 Equal heat capacities for all species
Equations for temperature may be simplified by using assumptions on the species heat ca-
pacities C . First, assuming that all heat capacities are equal C = C and h = h
pk p,k p s,k s
(an assumption which is not often true in flames but is often used!), the
PN
C Y V
k=1 p,k k k,i
term in the temperature equation (1.61) is C
PN
Y V =0 and the temperature equation
p k=1 k k,i
becomes:v
• for variable pressure, equal C flames:
p,k
(cid:18) (cid:19) N
ρC DT =ω˙0 + Dp + ∂ λ ∂T +τ ∂u i +Q˙ +ρ X Y f V (1.70)
p Dt T Dt ∂x ∂x ij∂x k k,i k,i
i i j
k=1
• for constant pressure, low speed, equal C flames:
p,k
(cid:18) (cid:19) N
ρC DT =ω˙0 + ∂ λ ∂T +Q˙ +ρ X Y f V (1.71)
p Dt T ∂x ∂x k k,i k,i
i i
k=1
Here the two reaction rates ω˙0 and ω˙ (Eq. 1.62) are equal:
T T
N N N N N
X X X X X
ω˙0 =− h ω˙ =− h ω˙ − ∆ho ω˙ =−h ω˙ − ∆ho ω˙ =ω˙ (1.72)
T k k s,k k f,k k s k f,k k T
k=1 k=1 k=1 k=1 k=1
because
PN
ω˙ =0.
k=1 k
The energy and enthalpy equations also have simplified forms if all heat capacities are
equal:
(cid:18) (cid:19)
DE ∂ρE ∂ ∂ ∂T
ρ = + (ρu E)=ω˙ + λ
Dt ∂t ∂x i T ∂x ∂x
i i i
N
+ ∂ (σ u )+Q˙ +ρ X Y f (u +V ) (1.73)
∂x ij i k k,i i k,i
j
k=1
vTheheatcapacityCp maystillbeafunctionoftemperature.

## 페이지 37
24 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
(cid:18) (cid:19)
DH ∂ρH ∂ ∂p ∂ ∂T
ρ = + (ρu H)=ω˙ + + λ
Dt ∂t ∂x i T ∂t ∂x ∂x
i i i
N
+ ∂ (τ u )+Q˙ +ρ X Y f (u +V ) (1.74)
∂x ij i k k,i i k,i
j
k=1
Notethat,ifallheatcapacitiesareequalbutalsoindependentoftemperature,theequation
for ρe is an equation for pressure because:
s
!
Z T
ρe =ρ C dT −RT /W =ρ(C T −C T )=p/(γ−1)−ρC T
s v 0 v p 0 p 0
T0
where γ =C /C . Replacing ρe in Eq. (1.57) gives and using the continuity equation:
p v s
(cid:18) (cid:19) N
1 Dp =− γp ∂u i +ω˙ + ∂ λ ∂T +τ ∂u i +Q˙ +ρ X Y f V (1.75)
γ−1 Dt γ−1∂x T ∂x ∂x ij∂x k k,i k,i
i i i j
k=1
Formostdeflagrations, pisalmostconstant: inEq.(1.75), thefirsttermontheRHS(due
to dilatation) compensates the other terms. When a compressible code is used for reacting
flows, this equation controls pressure and explains how such codes react to perturbations. If
the heat release term ω˙ , for example, is too high, pressure will locally increase. If γ is not
T
estimated correctly, the term − γp ∂ui will also induce pressure modifications. Eq. (1.75) is
γ−1∂xi
a useful diagnostic tool to identify problems in codes for compressible reacting flows. It may
also be used to construct a wave equation in reacting flows (see § 8.3.2).
1.2.3 Constant heat capacity for the mixture only
ItisalsopossibletoassumethatthemixtureheatcapacityC isconstantbecauseonespecies
p
(N for example) is dominant in the mixture but that the C ’s are not equal: this approxi-
2 p,k
mationisslightlyinconsistentbecauseC = PN C Y butitisusedinKuo285 forexample
p k=1 p,k k
to derive the following temperature equation by setting Dhs/Dt=C DT/Dt in the equation
p
for h (Eq. 1.55):
s
(cid:18) (cid:19) N !
DT Dp ∂ ∂T ∂ X
ρC =ω˙ + + λ − ρT C Y V
p Dt T Dt ∂x ∂x ∂x p,k k k,i
i i i
k=1
N
+τ ∂u i +Q˙ +ρ X Y f V (1.76)
ij∂x k k,i k,i
j
k=1
where h was replaced by C T.
s,k p,k

## 페이지 38
1.3. SUMMARY OF CONSERVATION EQUATIONS 25
1.3 Summary of conservation equations
Table 1.8 summarizes the equations to solve for reacting flows.
Mass
∂ρ + ∂ρui =0
∂t ∂xi
Species: for k =1 to N −1 (or N if total mass is not used)
With diffusion velocities:
∂ρYk + ∂ (ρ(u +V )Y )=ω˙
∂t ∂xi i k,i k k
With Hirschfelder and Curtiss approximation:
∂ρ ∂ Y t k + ∂ ∂ xi (ρ(u i +V i c)Y k )= ∂ ∂ xi (ρD k W W k∂ ∂ X xi k)+ω˙ k and V i c = PN k=1 D k W W k∂ ∂ X xi k
Momentum
∂ ρu + ∂ ρu u =− ∂p + ∂τij +ρ PN Y f
∂t j ∂xi i j ∂xj ∂xi k=1 k k,j
Energy (sum of sensible and kinetic)
∂ρE + ∂ (ρu E)=ω˙ − ∂qi + ∂ (σ u )+Q˙ +ρ PN Y f (u +V )
∂t ∂xi i T ∂xi ∂xj ij i k=1 k k,i i k,i
with ω˙ =− PN ∆ho ω˙ and q =−λ∂T +ρ PN h Y V
T k=1 f,k k i ∂xi k=1 k k k,i
Table 1.8: Conservation equations for reacting flows: the energy equation may be replaced by any
of the equations given in Table 1.7. Q˙ is the external heat source term and f measures the volume
k
forces applied on species k.

## 페이지 39
26 CHAPTER 1. CONSERVATION EQUATIONS FOR REACTING FLOWS
Formostdeflagrations,pressureisconstant,bodyforcesarezero(f =0),viscousheating
k,j
is negligible so that these equations may be simplified as shown in Table 1.9.
Mass
∂ρ + ∂ρui =0
∂t ∂xi
Species: For k =1 to N −1 (or N if total mass is not used)
With diffusion velocities:
∂ρYk + ∂ (ρ(u +V )Y )=ω˙
∂t ∂xi i k,i k k
With Hirschfelder and Curtiss approximation:
∂ρ ∂ Y t k + ∂ ∂ xi (ρ(u i +V i c)Y k )= ∂ ∂ xi (ρD k W W k∂ ∂ X xi k)+ω˙ k and V i c = PN k=1 D k W W k∂ ∂ X xi k
Momentum
∂ ρu + ∂ ρu u =− ∂p + ∂τij
∂t j ∂xi i j ∂xj ∂xi
Energy (sum of sensible and kinetic)
∂ρE + ∂ (ρu E)=ω˙ − ∂qi with ω˙ =− PN ∆ho ω˙
∂t ∂xi i T ∂xi T k=1 f,k k
Or temperature
(cid:16) (cid:17)
ρC DT =ω˙0 + ∂ (λ∂T )−ρ∂T PN C Y V
p Dt T ∂xi ∂xi ∂xi k=1 p,k k k,i
with ω˙0 =− PN h ω˙ and q =−λ∂T +ρ PN h Y V
T k=1 k k i ∂xi k=1 k k k,i
Table 1.9: Conservation equations for constant pressure, low Mach number flames.

## 페이지 40
Chapter 2
Laminar premixed flames
2.1 Introduction
The elementary case of a one-dimensional laminar flame propagating into a premixed gas
(fuel mixed with air for example) is a basic problem in combustion, both for theory and for
numerical techniques. Numerically solving for laminar premixed flames is of interest because:
• It is one of the few configurations where detailed comparisons between experiments,
theory and computations can be performed.
• It may be used to validate chemical models as discussed in Section 1.1.1.
• Many theoretical approaches may be used for laminar flames, not only to study their
one dimensional structure but also the various instabilities which can develop on such
fronts (Williams554).
• Laminar flames are viewed in many turbulent combustion models as the elementary
building blocks of turbulent flames (flamelet theory: see Chapt. 5).
From the point of view of numerical techniques, computing laminar premixed flames is a
firststeptowardmorecomplexconfigurations. However,thisstepisnotnecessarytocompute
turbulent flames using models as shown in Chapter 5 because most turbulent combustion
modelsessentiallyusecompletelydifferentapproaches: codesdevotedtoturbulentcombustion
can usually not be used for laminar flames.
Therearemanywaystocomputelaminarflamestructureandspeeddependingonthecom-
plexity of the chemistry and transport descriptions (§ 2.2). With complex chemical schemes,
there is no analytical solution to the problem and numerical techniques are needed (§ 2.3).
However, when chemistry and transport are suitably simplified, analytical or semi-analytical
solutions may be developed and these shed an essential light on the behavior of flames and
on the numerical challenges to face when one tries to compute them in simple or complex
27

## 페이지 41
28 CHAPTER 2. LAMINAR PREMIXED FLAMES
situations (§ 2.4). These solutions are useful to check the precision of combustion codes and
to provide initial solutions for these codes. They are also needed to determine resolution
requirements for flames.
2.2 Conservation equations and numerical solutions
Forlaminarone-dimensionalpremixedflames,theconservationequationsderivedinChapter1
can be simplified starting from Table 1.9 (the index 1 corresponding to the x direction is
omitted):
• Mass conservation
∂ρ ∂ρu
+ =0 (2.1)
∂t ∂x
• Species conservation. For k =1 to N −1:
∂ρY ∂
k + (ρ(u+V )Y )=ω˙ (2.2)
∂t ∂x k k k
• Energy
(cid:18) (cid:19) (cid:18) (cid:19) N !
∂T ∂T ∂ ∂T ∂T X
ρC +u =ω˙0 + λ −ρ C Y V (2.3)
p ∂t ∂x T ∂x ∂x ∂x p,k k k
k=1
with ω˙0 =− PN h ω˙
T k=1 k k
These equations describe a wave propagating from the burnt to the fresh gas at a speed
which reaches a constant value s when transients are ignored. Solving for the structure
L
of this flame is still a research task for complex chemistry descriptions even when the flame
has reached a constant velocity. When the flame is steady, writing Eq. (2.1) to (2.3) in the
reference frame of the flame (moving at speed s ) leads to:i
L
ρu=constant=ρ s (2.6)
1 L
iNote that the momentum equation is not needed anymore. It can be used to compute the pressure field
afterallfieldshavebeencomputedbyintegrating(viscoustermsareneglected):
∂p ∂u
=−ρu or p(x)=p1−ρ1sL(u(x)−u1) (2.4)
∂x ∂x
Thepressurejumpthroughasteadyflamefrontisobtainedbyintegratingthisequationbetween−∞to∞:
p2−p1=ρ1u2
1
(1−u2/u1)=ρ1s2
L
(1−T2/T1) (2.5)
using the notations of Fig. 2.1. These pressure jumps through flame fronts are small: for a stoichiometric
methane-airflame,withaflamespeedof0.4ms/sandatemperatureratioT2/T1 closeto7,p2−p1 isofthe
orderof1Pa. Checkingincompressiblecombustioncodeswhethertheycapturethecorrectpressurejumpin
premixedflamesisagoodwaytoverifythatboundaryconditionsandnumericaltechniquesareadequate.

## 페이지 42
2.2. CONSERVATION EQUATIONS AND NUMERICAL SOLUTIONS 29
∂
(ρ(u+V )Y )=ω˙ (2.7)
∂x k k k
(cid:18) (cid:19) N !
∂T ∂ ∂T ∂T X
ρC u =ω˙0 + λ − ρ C Y V (2.8)
p ∂x T ∂x ∂x ∂x p,k k k
k=1
This set of equations is closed if a model is given for the reaction rate ω˙ (Arrhenius law)
k
and for the diffusion velocities V (Fick’s law with a correction velocity, for example) and if
k
proper boundary conditions are provided. For premixed flames, these boundary conditions
may raise some difficulties. Typical inlet conditions (at location x = 0) correspond to a cold
premixedgasflow(Fig.2.1): u(x=0)=u ,Y imposedforreactants(inproportionsimposed
1 k
by the code user), T(x=0)=T imposed.
1
7 STATE 1: fresh gas STATE 2: burnt gas
6
Reaction rate
5 Normalized temperature T / T1
4
3 Normalized fuel mass fraction Y / YF1
2
1
0
0.0 Abscissa (x) x=l
Figure2.1: Basicconfigurationforcomputationsofone-dimensionalpremixedflames. State1: fresh
gas quantities; State 2: burnt gas quantities.
These conditions are not enough to determine whether the flame actually exists in the
computational domain:
• The temperature T is usually low and most reaction terms at this temperature are
1
almost zero. If this flow is computed in a parabolic way, i.e. by starting from x=0 and
updating all variables for increasing x, the mass fractions (and other quantities as well)
remain constant. Reaction rates rise but so slowly that the ignition point is rejected to
infinity. This is the “cold boundary” problem (Williams554). From a numerical point
of view, this paradox is easily solved by recognizing that an additional condition must
be imposed, at least in the initial conditions: the flame must have been ignited before
it reaches the right side of the domain and the temperature must reach the adiabatic
flametemperatureattheoutletofthedomain(x=l). Anotherwaytoexpressthesame
point is that deflagrations are elliptic phenomena: what happens downstream controls

## 페이지 43
30 CHAPTER 2. LAMINAR PREMIXED FLAMES
the flame propagation upstream. This feedback mechanism is produced by thermal and
species diffusion as shown in Section 2.4.ii
• Eveniftheflameisignited,steadysolutioncanexistonlyiftheinletvelocityu isequal
1
to the flame speed s (the flame remains on a fixed position). This means that the
L
problemtosolveisaneigenvalueproblem: theunknownsaretheprofilesoftemperature,
species and velocity but also the flame speed s which is the eigenvalue of the problem.
L
2.3 Steady one-dimensional laminar premixed flames
The simplest flame configuration is a planar laminar premixed flame propagating in one di-
rection. It is a one-dimensional problem. It is also a steady problem if equations are written
in the reference frame of the flame.
2.3.1 One-dimensional flame codes
Solving Eqs. (2.6) to (2.8) is a numerical problem for which many mathematical tools have
been developed in the last twenty years. Typical chemical schemes involve two to hundreds
of species with one to thousands of reactions. When proper boundary conditions are set up
and the problem is discretized on a finite difference grid, the resulting system is a strongly
non linear boundary value problem which can be written:
L(U )=0 (2.9)
i
where U =(T,Y ,Y ,....Y ,U) is the vector of unknowns at point x .
i 1 2 N i i
ThissystemisusuallysolvedwithNewton-typemethods. Thereisnoneedtodevelopsuch
codestodaybecausereliabletoolsalreadyexistsuchasPREMIX(Keeetal.260, Keeetal.258,
Kee et al.259, see also http://www.reactiondesign.com/webdocs). Fig. 2.2 shows the output
of such codes for a H - O flame at atmospheric pressure. The flame speed is 32 m/s (such
2 2
high deflagration speeds are obtained only for pure hydrogen - oxygen combustion and are
typical of cryogenic rocket combustion). The chemical scheme for this computation is given
in Table 1.5. For this computation, PREMIX uses an adaptive grid and the smallest grid size
is 0.001 mm while the largest one is 0.19 mm.
PREMIX and similar one-dimensional flame codes have certain specificities. Two very
different tasks have to be performed with one-dimensional flame codes:
• for a given situation, compute a first flame or
• having this first flame solution, compute other solutions for which physical parameters
(equivalence ratio, temperature, pressure, etc) are varied.
iiDetonations are different: they are essentially parabolic phenomena which can be computed by time or
spacemarchingtechniquesbecausediffusionphenomenaarenegligible.

## 페이지 44
2.3. STEADY ONE-DIMENSIONAL LAMINAR PREMIXED FLAMES 31
1.0
0.8
0.6
0.4
0.2
0.0
0.2 0.4 0.6 0.8 1.0
x [cm]
Y
0.0015
0.0010
H2
O2
OH
H2O 0.0005
O
H
0.0000
0.2 0.4 0.6 0.8 1.0
x [cm]
Y
HO2
H2O2
4000.0
3000.0
2000.0
1000.0
0.0
0.2 0.4 0.6 0.8 1.0
x [cm]
]K[
erutarepmeT
2e+12
1e+12
5e+11
0
−5e+11
0.2 0.4 0.6 0.8 1.0
x [cm]
]3mc/gre[
esaeler
taeH
Figure 2.2: PREMIX Computation of a stoichiometric H - O premixed flame at 1 bar. Fresh gas
2 2
temperature: 700 K. Profiles of species, temperature and heat release.
Computing the first flame is always a challenge because all techniques used to solve the
system (2.9) have a finite radius of convergence: if the fields given initially for T and for all
species Y are too far from the solution, no convergence is obtained. Unfortunately, when
k
fuels requiring 300 species must be computed, initializing these 300 profiles in a smart way is
a task depending largely on the experience of the user. In many cases, other codes must be
used to initialize the one-dimensional flame code. Furthermore, when new chemical schemes
with new constants are introduced, the lack of convergence of the one-dimensional flame code
may be due to a problem of initialization but may also be due to an improper modeling of
chemistry. ForanM reactionsscheme, 3M constantsmustbespecified(seeEq.1.25): A , β
j j
and T for j =1,M. For octane fuels, it is frequent to use up to 2000 reactions so that 6000
aj
constants are needed. Whether these 6000 constants are well chosen and are compatible with
a flame computation is a question which makes calculations of complex fuels very difficult.
Once a solutionis obtained fora given case (Case I), and anothercase (Case II)is studied

## 페이지 45
32 CHAPTER 2. LAMINAR PREMIXED FLAMES
2400
2200
2000
1800
1600
1400
1200
1000
)K(
erutarepmet
emalf
mumixaM
0 1 2 3 4 5
Equivalence ratio
Figure 2.3: Continuation computation of twin premixed H - air flames for a stretch rate of 1000
2
s−1 (Giovangigli, private communication, 1998). The maximum temperature in the flame is plotted
versus equivalence ratio.
(for example for a leaner or a richer flame), restarting the exercise from scratch is not an
optimum solution. Obviously, the solution obtained for Case I should be used to initialize
the computation of Case II. Flame specialists have developed special continuation methods
whichallowthecodetomoveinthesolutiondomaincontinuouslywhenparametersarevaried
(GiovangigliandSmooke187,Kalamatianosetal.250,GiovangigliandSmooke186). Thesetech-
niquesarecrucialwhenthecomputationispushedclosetotheflammabilitylimits: decreasing
the quantity of fuel in the fresh gases, for example, eventually leads to a total quenching of
the flame in which case the one-dimensional flame code should predict that the only solution
is a “no flame” regime. Determining the exact limit of this extinction may be done with
continuation techniques. Fig. 2.3 gives an example of a continuation computation for twin
stretched premixed hydrogen/air flames in a stagnation point flow (see § 2.6 for a definition
of stretched flames). The computation gives the variations of the flame temperature with
equivalence ratio, and the lean and rich extinction limits of flammability. It also provides the
non-physical branch going from a lean to rich condition which is unstable and is not observed
experimentally.
2.3.2 Sensitivity analysis
In addition to continuation techniques, another tool has changed the way one-dimensional
premixed flame codes are used today: sensitivity analysis. Being able to determine the effect
ofinputparameters(chemicalortransportparameters)isneededtounderstandwhichofthese
parameters control a given flame quantity.

## 페이지 46
2.3. STEADY ONE-DIMENSIONAL LAMINAR PREMIXED FLAMES 33
Sensitivity to chemical parameters
Since the number of chemical parameters to introduce in a flame computation with complex
chemistry can be counted in thousands, it is essential to know which of these parameters are
really important for a given flame property: for example, if the activation temperature of the
fourth reaction H+O ⇔OH+O in the scheme given in Table 1.5 is changed, how does the
2
flame speed change? Of course, it is possible to re-run the code and see the result. A better
way is to differentiate the whole code using sensitivity analysis tools (see Lutz et al.325 or
GiovangigliandSmooke188 foracompletedescription)anddirectlyobtainmapsofsensitivity
of all outputs versus chemical parameters (see examples in Kalamatianos et al.250, Fotache
et al.172 or Aung et al.19). Fig. 2.4 shows an example of sensitivity analysis of flame speeds
given by Aung et al.19 for hydrogen-air flames at normal temperature and a pressure of 0.35
atm. Four equivalence ratios are studied from 0.45 to 3.5. Such sensitivity analysis reveal the
chain branching reaction OH+H ⇔H+H O to be very important in the determination of
2 2
the flame speed.
Figure2.4: Sensitivityanalysisofthelaminarflamespeedofhydrogenairflames. Foreachreaction,
thefigureprovidestheeffectofachangeofrateontheflamespeed(ReprintedbypermissionofElsevier
Science from Aung et al.19 (cid:13)c the Combustion Institute).
Sensitivity to transport parameters
Transport models (for diffusion coefficients, viscosity, heat diffusion coefficient) also play im-
portant roles when computing flames. The chemistry community usually works on zero-
dimensional models (well stirred reactors for instance) in which space variations are ignored

## 페이지 47
34 CHAPTER 2. LAMINAR PREMIXED FLAMES
and only time evolutions are studied. In flames, however, the way reactants diffuse towards
the place where they burn is often as important as chemistry itself (as shown by theory in
the next sections) and the importance of transport on the overall results of one-dimensional
flame codes has recently become an issue in many cases. As an example, Fig. 2.5 displays
the variation of flame speed versus equivalence ratio for a methane/air flame for which two
approaches for transport were tested in PREMIX:
• Full chemistry using the GRI mechanism (http://euler.berkeley.edu/ gri mech) and full
transport.
• Full chemistry using the same scheme and Fick’s law with all Lewis numbers set to
unity. This assumption is used in many theoretical approaches (see § 2.4). It is true for
most radicals in a flame except for very light molecules like H or H which have Lewis
2
numbers of the order of 0.11 and 0.3 respectively (see Fig. 1.4).
50
40
30
20
10
0
)s/mc(
0
s
deeps
emalf
ranimaL
L
Complex transport
Lewis =1 for all species
0.6 0.8 1.0 1.2 1.4
Equivalence Ratio, φ
Figure 2.5: The effect of transport on premixed flames: comparison of exact transport model and
simplifiedmodel(Lewis=1forallspecies)inanatmosphericmethane/airflame. (B.Bedat,private
communication, 1999).
Fig. 2.5 shows that assuming equal diffusivities for all species has a significant effect on
flamespeed. Asomewhatworryingaspectofthissensitivitytotransportmodelsisthatthese
models, even in their most refined forms, are being discussed today and that the diffusion
coefficients estimated by usual packages probably exhibit larger error margins than generally
expected (Paul and Warnatz392).

## 페이지 48
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 35
2.4 Theoretical solutions for laminar premixed flames
The computation of premixed flames with complex chemistry and transport is possible but
severe restrictions prevent the use of these tools in many situations (for example, unsteady
flames). Furthermore, one-dimensional planar steady premixed flames represent only one
flame configuration: many more must be studied and understood for example to address the
problem of turbulent combustion. Being able to tackle more complex questions on the fluid
mechanicslevelrequiresimplificationsofchemistryandtransport. Thissectionpresentssome
simple analytical results which have extremely useful implications for numerical combustion.
2.4.1 Derivation of one-step chemistry conservation equations
Thesimplificationsrequiredtodevelopsimpleanalyticalsolutionsforflamesarethefollowing
(Williams554):
• AllspecieshavethesamemolecularweightW =W andthesameconstantheatcapacity
k
C = C . They also have the same molecular diffusion coefficient D = D so that all
p,k p k
Lewis numbers are equal Le = λ/(ρC D ) = Le. Finally species and heat diffuse in
k p k
the same way so that Le=1.
• Chemistry proceeds only through one irreversible reaction: M =1 in Eq. (1.19).
N N
X X
ν0 M → ν00 M (2.10)
k1 k k1 k
k=1 k=1
The reverse reaction rate is zero: K = 0. The K temperature dependence of the
r1 f1
forward reaction follows an Arrhenius dependence: K
f1
=A
1
Tβ1e−Ta1/T. The reaction
rates ω˙ for each species are linked to the progress rate Q at which the single reaction
k 1
proceeds by Eq. (1.22):
ω˙
k =Q or ω˙ =W ν Q (2.11)
W ν 1 k k k1 1
k k1
The heat release term ω˙ in the temperature equation becomes:
T
N N
X X
ω˙ =− ∆ho ω˙ =−Q (∆ho W ν )=|ν |QmQ (2.12)
T f,k k 1 f,k k k1 F1 1
k=1 k=1
where Qm is the molar heat of reaction:
N N N
Qm =− X ∆ho W ν k1 =− X ∆ho,m ν k1 = X ∆ho,m ν k1 (2.13)
f,k k|ν | f,k |ν | f,k ν
F1 F1 F1
k=1 k=1 k=1

## 페이지 49
36 CHAPTER 2. LAMINAR PREMIXED FLAMES
because ν = ν00 −ν0 is negative. Qm measures the heat released by the complete
F1 F1 F1
combustion of 1 mole of fuel. It is often useful to work with the heat of reaction per
unit mass (the heat released by the combustion of 1 kg of fuel). There are two ways to
define this quantity. The first possibility is:
Q0 =− Qm =− X N (cid:18) ∆ho W k ν k1 (cid:19) (2.14)
W f,kW ν
F F F1
k=1
The heat release source term ω˙ and the fuel source term ω˙ are then linked by:
T F
ω˙ =Q0ω˙ (2.15)
T F
Notethatwiththisconvention,Qm ispositivewhileQ0 isnegative. Someauthorsprefer
to define Q as:
Q=−Q0 = Qm = X N (cid:18) ∆ho W k ν k1 (cid:19) (2.16)
W f,kW ν
F F F1
k=1
to have positive Q values. The link between ω˙ and ω˙ becomes:
T F
ω˙ =−Qω˙ (2.17)
T F
The second convention is retained in this text. Typical values of Qm and Q are summa-
rized in Table 2.1. Note that the values of the heat released per unit mass of fuel Q for
hydrocarbons are all very similar.
• The rate ω˙ of the reaction (2.10) is assumed to be limited by the fuel mass fraction
F
andnotbytheoxidizermassfraction. Thisassumptioncorrespondstostudyaverylean
flame in which Y remains approximately constant: Y = Y1. Only one species (Y )
O O O F
has then to be considered to evaluate the fuel reaction rate. This situation is obtained
for
ν0 =1; ν00 =0; ν =−1; ν0 =ν00 =ν =0 (2.18)
F1 F1 F1 O1 O1 O1
so that, using Eq. (1.22) and (1.24):
ω˙ =A Tβ1ν ρY e−Ta1/T =B Tβ1ρY e−Ta1/T (2.19)
F 1 F1 F 1 F
where
B =A ν (2.20)
1 1 F1
Eventhoughtheseassumptionsmayseemstrong(forexampleatthechemistrylevel),they
actually preserve many essential features of flames: intense non-linear heat release, variable
density and temperature.

## 페이지 50
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 37
Global reaction Qm Q s Yst
F
(kJ/mole) (kJ/kg)
CH +2O → CO +2H O 802 50100 4.00 0.055
4 2 2 2
C H +5O → 3CO +4H O 2060 46600 3.63 0.060
3 8 2 2 2
2C H +25O → 16CO +18H O 5225 45800 3.51 0.062
8 18 2 2 2
2H +O → 2H O 241 120500 8.00 0.028
2 2 2
Table 2.1: Values of molar (Qm) and mass (Q) heat of reactions and stoichiometric ratio s =
(ν W )/(ν W ) for different irreversible reactions. The last column is the fuel mass fraction for
O O F F
stoichiometric combustion in air given by Eq. (1.31).
The fuel mass fraction in the fresh gas is imposed (Y =Y1). The corresponding conser-
F F
vation equations become (in the flame reference frame):
ρu=constant=ρ u =ρ s (2.21)
1 1 1 L
(cid:18) (cid:19)
dY d dY
ρ s F = ρD F +ω˙ (2.22)
1 L dx dx dx F
(cid:18) (cid:19)
dT d dT
ρ C s = λ −Qω˙ (2.23)
1 p Ldx dx dx F
In these expressions, the fuel reaction rate ω˙ is negative.
F
2.4.2 Thermochemistry and chemical rates
A useful exercise is to integrate Eqs. (2.22) and (2.23) between x = −∞ and x = +∞ (see
Fig. 2.1). Diffusive terms on both sides of the domain are zero and the inlet speed must be
equal to the flame speed so that the following relations are obtained:
Z +∞
ρ s Y1 =− ω˙ dx=Ω (2.24)
1 L F F F
−∞
Z +∞
ρ C s (T −T )=−Q ω˙ dx=QΩ (2.25)
1 p L 2 1 F F
−∞
where Ω is the total fuel consumption in the domain.
F
These equations express simple integral properties of the flame. Eq. (2.24) shows that all
fuel entering the domain (ρ Y1s ) is burnt downstream in the flame front by Ω . Eq. (2.25),
1 F L F

## 페이지 51
38 CHAPTER 2. LAMINAR PREMIXED FLAMES
on the other hand, states that the power released by the combustion of this fuel (QΩ ) is
F
entirely converted into sensible energy to heat up the mass flux ρ C s from T to T .iii
1 p L 1 2
Now eliminating Ω between Eq. (2.24) and (2.25) leads to:
F
C (T −T )=QY1 so that T =T +QY1/C (2.28)
p 2 1 F 2 1 F p
whichprovidestheadiabaticflametemperatureT . Eq.(2.28)isathermochemicalexpression
2
which can be also directly derived from the conservation of enthalpy between fresh and burnt
gas:
N N N
X X X
C (T −T )+ ∆ho Y1 =C (T −T )+ ∆ho Y2 or C (T −T )= ∆ho (Y1−Y2)
p 1 0 f,k k p 2 0 f,k k p 2 1 f,k k k
k=1 k=1 k=1
(2.29)
where T = 298.15K is the reference temperature for formation enthalpies. All species in-
0
volved in the summation of Eq. (2.29) are linked by Eq. (2.11) leading to:
Y k 1−Y k 2 = W k ν k1 and C (T −T )= X N ∆ho W k ν k1 Y1 =−Q0Y1 =QY1 (2.30)
Y1−0 W ν p 2 1 f,kW ν F F F
F F F1 k=1 F F1
recovering Eq. (2.28).
Thesesimplederivationshaveimplicationsforcombustioncodeswhichcanbesummarized
as follows:
• Thermochemistry (i.e. formation enthalpies ∆ho , heat capacities C and reactants
f,k p,k
species mass fractions) controls the maximum temperature which can be reached in a
premixed flame computation.
• Chemical parameters (preexponential constant A , activation temperature T and ex-
1 a1
ponent β ) control the speed of combustion, i.e. the time or the distance needed for
1
combustion to proceed from the fresh to the burnt state.
iiiThisresultisvalidonlyforleanflameswithoneirreversiblereaction. Similarexpressionsmaybewritten
forthegeneralformofthecombustionequations,withoutinvokinganyoftheassumptionsusedherebuttheir
interpretationismoredifficultbecausefuelmaynotbetotallyburntattheexitofthedomain. Forexample,
Eq.(1.37)canbeintegratedfrom−∞to+∞foranyspeciesk inthereferenceframeofapremixedflameto
yield:
Z +∞
ρ1(Y
k
1−Y
k
2)sL=− ω˙
k
dx (2.26)
−∞
whereY1 andY2 arethevaluesofY atx=−∞and+∞respectively. Thisequationhasameaningonlyfor
k k k
species which are present on one side of the flame at least. It provides a correct estimate of the flame speed
onlyifY2 isknown. Forburntgases,forexample,ityields:
k
Z +∞
ρ1Y
P
2sL= ω˙Pdx (2.27)
−∞

## 페이지 52
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 39
Therefore, in a combustion code, there is no sense, for example, to increase the speed of
combustion (by increasing the preexponential constant A) in order to increase the maximum
temperaturesincethesetwoquantitiesareuncorrelated. Theseproperties,demonstratedhere
only for a single-step chemistry, are valid also for complex chemical schemes. It is also true
for turbulent combustion models.
The adiabatic flame temperature obtained with Eq. (2.28) and Table 2.1 provides correct
orders of magnitude when compared to measurements but is not a precise estimation because
of two important assumptions which are not true quantitatively:
• The combustion products used in the single step reactions of Table 2.1 are not the only
final products of combustion: additional reactions, especially dissociation of products
like CO and H O, take place at high temperatures. These reactions are endothermic
2 2
and decrease temperature levels.
• The heat capacities C vary significantly with temperature and may induce errors of
p
hundreds of degrees on the adiabatic flame temperature.
2400
2200
2000
1800
1600
1400
)K(
erutarepmet
emalf
citabaidA
Full chemistry and variable Cp
One-step chemistry and variable Cp
One-step chemistry and constant Cp
0.5 0.6 0.7 0.8 0.9 1.0 1.1 1.2
Equivalence ratio φ
Figure 2.6: Adiabatic flame temperature for an atmospheric propane-air flame (T =300 K) using
1
various assumptions.
Theselimitsmaybeovercomebyperformingequilibriumcomputations,byminimizingthe
Gibbsenergy,andusingspecialthermodynamicspackagessuchasCHEMKIN.ButEq.(2.28)
is useful to understand combustion and is used for turbulent combustion models. It is, for
example, required for the derivation of the Bray Moss Libby (BML) model (Libby et al.307,
Bray et al.63) for turbulent premixed flames. As an example, Fig. 2.6 shows adiabatic flame
temperatures for atmospheric propane/air flames computed with three different methods:
• M1: Full chemistry and variable heat capacity: both variable C and dissociations are
p
accounted for.

## 페이지 53
40 CHAPTER 2. LAMINAR PREMIXED FLAMES
• M2: Single-step chemistry and variable heat capacity: no dissociations are taken into
account but the variations of C are included.
p
• M3: Single-step chemistry and constant heat capacity: both the dissociations and the
C variations are neglected.
p
The comparison between M1 and M2 results shows the effects of dissociations: at low equiva-
lenceratio,themaximumtemperatureislowenoughtoavoidanydissociationandmethodM2
is precise. At higher equivalence ratio, dissociations of the products lower the temperature.
Forastoichiometricflame,thiseffectdecreasesthetemperatureby150K.MethodM3isused
here with Q = 46600 kJ/kg and C = 1300 J/(kgK). It leads to errors for all equivalence
p
ratios which are of the order of 100 K but it still provides a correct simple evaluation of the
final temperature.
2.4.3 The equivalence of temperature and fuel mass fraction
Eq. (2.22) and (2.23) may be simplified introducing reduced variables:
C (T −T ) T −T
Y =Y /Y1 and Θ= p 1 = 1 (2.31)
F F QY1 T −T
F 2 1
The reduced fuel mass fraction Y goes from 1 in the fresh gases to 0 in the burnt gases
whileΘgoesfrom0to1inthesezones. TheequationsforY andΘarederivedfromEq.(2.22)
and (2.23) using Eq. (2.28):
(cid:18) (cid:19)
dY d dY
ρ s = ρD +ω˙ /Y1 (2.32)
1 L dx dx dx F F
(cid:18) (cid:19)
dΘ d λ dΘ
ρ s = −ω˙ /Y1 (2.33)
1 Ldx dx C dx F F
p
Summing these two equations and assuming unity Lewis number Le = λ/(ρC D) = 1
p
gives:
(cid:20) (cid:21)
d d d
ρ s (Θ+Y)= ρD (Θ+Y) (2.34)
1 Ldx dx dx
which has no source term and is a conserved (or passive) scalar equation. Since Θ+Y is 1 in
the fresh gases and 1 in the burnt gases, the only solution to Eq. (2.34) is:iv
Θ+Y =1 (2.35)
This integral property of premixed flames can also be derived by stating that the total
enthalpy of the mixture is constant everywhere. Temperature and fuel mass fraction are
ivThisproperty(Θ+Y =1)isalsotrueinunsteadycasesiftheinitialconditionssatisfythesameproperty.
This is a useful test for numerical algorithms applied to premixed flames: summing Θ and Y must give 1
everywhere.

## 페이지 54
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 41
not independent quantities: when the fuel mass fraction goes down (the chemical enthalpy
decreases), the temperature increases (the sensible enthalpy increases). From a numerical
point of view, only one variable Θ can be solved for. The other one (Y) is obtained from Θ
using Eq. (2.35). The equation for Θ is:v
(cid:18) (cid:19) (cid:18) (cid:19)
dΘ d λ dΘ T
ρ s = −B (T +Θ(T −T ))β1ρ(1−Θ)exp − a1 (2.36)
1 Ldx dx C dx 1 1 2 1 T +Θ(T −T )
p 1 2 1
The reduced temperature Θ (or 1−Y) is also called the progress variable c.
2.4.4 The reaction rate
Eq. (2.36) is useful to understand the physics of laminar flames: flame theory has found in
such flames a very open field of investigation and many of the most important results on
combustionhavebeenderivedfromtheseequations. Thesestudiesarenotdescribedhere(see
Williams554 or Williams555 for a review) but some basic results are useful for computations.
To do this, some of the terminology of theoretical models for laminar premixed flames must
be introduced. First, the reduced reaction rate (ω˙ in Eq. (2.33) or (2.36)) is expressed by
F
Williams554 in a more convenient form:
(cid:18) (cid:19)
ω˙ β(1−Θ)
F =B Tβ1e−β/αρ(1−Θ)exp − (2.37)
Y1 1 1−α(1−Θ)
F
(cid:16) (cid:17)
where e−Ta/T has been replaced by exp(−β/α)exp − β(1−Θ) and:
1−α(1−Θ)
α=(T −T )/T =QY1/(C T ) and β =αT /T (2.38)
2 1 2 F p 2 a1 2
The two parameters α and β measure the heat released by the flame and the activation
temperature respectively. Typical flame values are listed in Table 2.2 for a temperature
T = 300K. Flame 1 is a flame used for numerical simulations of turbulent combustion
1
(see Chapt. 4) in which chemical parameters are modified to allow an easier computation
while Flame 2 corresponds to more realistic values for hydrocarbon-air flames.
T /T E (kJ/mole) T /T α β
2 1 a1 a1 1
Flame 1 4 110 42.7 0.75 8.0
Flame 2 7 375 150 0.86 18.4
Table 2.2: Typical values for α and β in premixed flames.
The density ρ is also a function of Θ if pressure is constant:
1
ρ=ρ (2.39)
11+αΘ/(1−α)
vRememberthatB1 isnegativeinthisequation(seeEq.(2.20))becauseνF isnegative.

## 페이지 55
42 CHAPTER 2. LAMINAR PREMIXED FLAMES
-9
300x10
200
100
0
etar
noitcaer
decudeR
(1-α)/β exp(−1−β/α)
0.0 0.5 1-1/(α+β) 1.0
Reduced temperature θ= (T-T1) / (T2-T1)
Figure 2.7: Variations of the reduced reaction rate (ω˙ F /ρ 1 Y F 1B 1 )=e− α β ρ ρ 1 (1−Θ)e− 1− β( α 1 ( − 1− Θ Θ ) ) vs Θ
for α=0.75, β =8 (β =0).
1
so that the reaction rate ω˙ is now a function of only one variable: Θ. Fig. 2.7 presents
F
variations of the reduced reaction rate ω˙ for α = 0.75 and β = 8, assuming β = 0, while
F 1
Fig. 2.8 gives ω˙ for increasing values of β. For each case in Fig. 2.8, the preexponential
F
constant B has been roughly adjusted to provide the same value for the total reaction rate
1
R
ω˙ dx, i.e. to provide the same flame speed. Fig. 2.8 conveys a simple idea: to compute a
F
flamewithagivenflamespeed, increasingβ (i.e. increasingtheactivationtemperature)leads
to a stiffer problem where ω˙ is almost zero over a wide range of temperature and peaks for
F
Θ values very close to unity. In terms of resolution, it is already obvious that mesh points
are needed to resolve the temperature (or species) profile (typically 10 to 20 grid points for
0 < Θ < 1) because diffusion terms are important everywhere in this zone. Fig. 2.8 shows
that points are also needed in the vicinity of Θ = 1 to resolve the reaction source terms.
This constraint is much more demanding as shown by asymptotic analysis (Williams554): in
general, the maximum of the reaction rate shown in Fig. 2.8 is obtained for Θ of the order
of 1−1/β. The exact value at which the reaction rate predicted by Eq. (2.37) is maximum
maybecalculatedexplicitlyforthissimplecase, bysearchingforthemaximumofω˙ (Θ)and
F
gives:
Θ =1−1/(α+β) (2.40)
max
which is indeed close to the asymptotic estimate 1−1/β because β is much larger than α.
The value of the maximum reduced reaction rate is (Fig. 2.7):
(cid:18) (cid:19)
1−α β
ω˙max =ρ Y1B exp − −1 (2.41)
F 1 F 1 β α
The zone where the reaction rate is non-zero in a premixed flame is small compared to
diffusion length scales and, in temperature space, roughly spans the domain (1−2/β,1) with

## 페이지 56
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 43
etar
noitcaer
decudeR
α = 0.75 β=4
α = 0.75 β=8
α = 0.75 β=13
α = 0.75 β=20
0.2 0.4 0.6 0.8 1.0
Reduced temperature Θ = (T-T1) / (T2-T1)
Figure 2.8: Variations of the reduced reaction rate ω˙ /(ρ Y1B ) vs Θ (β = 0) for various values
F 1 F 1 1
of β: the problem becomes stiffer when β increases (i.e. when the activation temperature increases).
The preexponential constant B has been adjusted to provide the same value of the total reaction
1
rate (i.e. the same flame speed) for all flames.
awidthofδ =2/β (Fig.2.9). Intermsofmeshrequirements,insteadofadequatelyresolving
r
the Θ domain from 0 to 1 (width 1), it is now necessary to resolve the (1−2/β,1) interval
(width δ =2/β).
r
The first implication of such a simple analysis is the following: if a mesh is sufficient, for a
givenReynoldsnumber,toresolveanonreactingflow,i.e. toresolvetemperaturesgoingfrom
0 to 1, the mesh density to resolve the same flow with a premixed flame must be multiplied
by a factor β/2 in each direction. For typical values of β (10 to 20), this is, in most cases, a
difficult task!
Asymptoticanalysisalsoshowsthatzone1inFig.2.9(fromΘ=0to1−2/β)isdominated
byconvectionanddiffusion(phenomenaalreadypresentinnon-reactingflowsandnotbringing
any new special constraint on resolution) while zone 2 (from Θ = 1−2/β to 1) is controlled
by reaction and diffusion. The existence of zones where different physical mechanisms with
different mesh constraints exist (coarse in zone 1, finer in zone 2 when β increases) can be
handled in two ways:
• For steady or one-dimensional unsteady flame computations, a natural approach is to
use adaptive meshes as done in most one-dimensional flame codes such as PREMIX.
Coarse meshes may be used in the diffusion/convection zones while more refined grids
areutilizedinreaction/diffusionzones. Sophisticatedrefinementtechniquesmaybeused
withefficiencyforsuchproblemsaslongasone-dimensionalflamesormulti-dimensional
steady flames are studied.
• Formulti-dimensionaland/orunsteadyflamesthechallengeismuchmoredifficult. Cer-

## 페이지 57
44 CHAPTER 2. LAMINAR PREMIXED FLAMES
Figure 2.9: Theresolutionconstraintsduetothethicknessofthereactionzoneinlaminarpremixed
flames.
tainauthorsadaptthemeshtothecomputation,refiningthegridbeforethecalculation
takes place (Mohammed et al.360). Adaptive mesh techniques have also been explored
(Dervieux et al.136) but the most successful approach to date has been to use chemical
schemes with moderate stiffness (β must be low) and fine grids everywhere because un-
steady flames move and can be located anywhere in the computational domain. This
approach is possible only for simple chemical systems. For certain fuels, it is simply
impossible to construct accurate chemical mechanisms with reasonable stiffness. The
state of the art today is that while one-dimensional flame codes are able to compute
almostanysteadyflameforarbitrarilycomplexchemistrydata,veryfewoftheseflames
can be handled in unsteady multi-dimensional flame codes.
2.4.5 Analytical solutions for flame speed
Under the previous simplifications, explicit expressions can be derived for flame speed and
flame structure. There are multiple ways to do so. This section presents first the classical
analysis of Zeldovich, Frank-Kamenetski and von Karman which is the basis of most asymp-
totic methods. A second fully analytical method is then presented.
Asymptotic analysis of Zeldovich, Frank-Kamenetski and von Karman (ZFK)
Eq. (2.36) may be further simplified by scaling the spatial variable x:
Z x ρ s C
ξ = 1 L pdx (2.42)
λ
0

## 페이지 58
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 45
Eq. (2.36) becomes for a steady propagating laminar flame in its reference frame:
dΘ d2Θ
= −Λω (2.43)
dξ dξ2
where ω is a reduced reaction rate defined (Williams554) by:
(cid:18) (cid:19)
β(1−Θ)
ω =(1−Θ)exp − (2.44)
1−α(1−Θ)
and Λ is a non dimensionalized quantity (the “flame parameter”):
Λ=
ρλ|B
1
|Tβ1
e−β/α =−
ρλB
1
Tβ1
e−β/α (2.45)
ρ2s2C ρ2s2C
1 L p 1 L p
as B is negative.
1
Undertheassumptionsusedinthissection,thestructureofallstationarypremixedflames
depends only on one parameter Λ for given α and β values. This flame parameter contains
informationonheat(orspecies)diffusion(λ)andrateconstants(B ). Thesetwomechanisms
1
control the flame speed: increasing the heat diffusivity or increasing rate constants increases
the flame speed in the same proportion.vi
In expression (2.45), the numerator ρλB
1
Tβ1 is supposed to be constant to perform the
mathematicalintegration. Thisisnotadifficultassumptiontosatisfy: anyvariationofλsuch
that λTβ1−1 = constant allows this assumption to be true. Evaluating the numerator in the
fresh gases gives:
D1 |B |Tβ1
Λ= th 1 1 e− α β (2.46)
s2
L
where D1 =λ/ρ C is the heat diffusivity in the fresh gas.
th 1 p
Variousasymptoticanalysistechniqueshavebeendevelopedinthecombustioncommunity
to solve Eq. (2.43). The first one is due to Zeldovich, Frank Kamenetski and von Karman
(ZFK) and gives a very simple result:
Λ=0.5β2 (2.47)
A more precise result is developed by Williams554:
(cid:18) (cid:19)
2
Λ=0.5β2 1+ (3α−1.344) (2.48)
β
IngeneralΛisoftheorderof100forusualflames. FromvaluesofΛgivenbyasymptotics
and its definition (Eq. (2.45)), the flame speed may be derived leading to:
1 (cid:16) (cid:17)1/2
s L = β e− 2 β α 2|B 1 |T 1 β1D t 1 h (2.49)
viThesituationisverydifferentfordiffusionflames(see§3)wherediffusivityistheprimaryfactorcontrolling
theoverallreactionrate.

## 페이지 59
46 CHAPTER 2. LAMINAR PREMIXED FLAMES
for the ZFK formulation (Eq. (2.47)) or:
(cid:18) (cid:19) (cid:18) (cid:19)
1 β 1.344−3α
s = exp − (2|B |Tβ1D1 )1/2 1+ (2.50)
L β 2α 1 1 th β
for the Williams formulation (Eq. (2.48)).
Analytical solution for a simplified reaction rate expression
Asymptotic solutions based on Arrhenius expressions such as the ZFK analysis require some
work to derive the necessary mathematics. A fully explicit expression for flame structure and
speedcanbeobtainedbyusinganotherformulationforthereactionrate. Theflamestructure
of Fig. 2.9 suggests that any reaction rate model which produces no combustion before the
criticaltemperatureΘ =1−1/β andintensecombustionbetweenΘ and1shouldreproduce
c c
most of the flame features.
700x10-9
600
500
400
300
200
100
0
etar
noitcaer
decudeR
Echekki Ferziger form
Arrhenius form
0.0 0.2 0.4 0.6 0.8 1.0
θ = 1- 1/ β
Reduced temperature θ= (Τ−Τ1) / (Τ2−Τ1) c
Figure 2.10: Analytical EF model (Echekki and Ferziger156 for premixed flame compared to the
usual Arrhenius form
Amongallpossibleformsforreactionrates,theArrheniusformisonepossibilitybutothers
are available. Fig. 2.10 shows a model proposed by Echekki and Ferziger156 (called EF here).
In the EF formulation, the reaction rate is zero before Θ and ρ R (1−Θ) when Θ>Θ . R
c 1 r c r
is a model constant. From Eq. (2.21) and (2.23), the conservation equations to solve are (C
p
is assumed to be constant):
ρu=ρ u =ρ s (2.51)
1 1 1 L
(cid:18) (cid:19)
dΘ d λ dΘ
ρ s = +ω˙ (2.52)
1 Ldx dx C dx EF
p

## 페이지 60
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 47
where
ω˙ =ρ R (1−Θ)H(Θ−Θ ) (2.53)
EF 1 r c
where H is the Heaviside function and Θ =1−1/β. These equations may be formulated in
c
a non dimensionalized form as with Eq. (2.43) using the flame coordinate ξ (Eq. (2.42)):
dΘ d2Θ
= −Λ ω (2.54)
dξ dξ2 1 1
where Λ = λR /(ρ s2C ) and ω = (1 − Θ)H(Θ − Θ ). Assuming a constant thermal
1 r 1 L p 1 c
conductivityλ=λ ,theflameparameterΛ isconstant.vii Eq.(2.52)iseasiertosolvethanfor
1 1
theArrheniusformgiveninEq.(2.43): supposethatthepointwherethecriticaltemperature
Θ =1−1/β is reached, is fixed at x=ξ =0. In this case ξ =(ρ s C )x/λ =x/δ where δ
c 1 L p 1
is a characteristic flame thickness given by:
λ D1
δ = 1 = th (2.55)
ρ C s s
1 p L L
and D1 is the thermal diffusivity of the fresh gas.
th
Reaction rate ω˙ Heat coefficient λ Flame parameter Λ
EF 1
Initial EF model ρR (1−Θ)H(Θ−Θ ) λ T ρλRr = λ1Rr
r c 1T1 ρ2
1
s2
L
Cp ρ1s2
L
Cp
Present model ρ R (1−Θ)H(Θ−Θ ) λ λ1Rr
1 r c 1 ρ1s2
L
Cp
Table 2.3: Assumptions used by Echekki and Ferziger156 and by this text on rate coefficients and
heat diffusion coefficient. λ is the value of the heat coefficient in the fresh gases.
1
The solution is obtained by first integrating Eq. (2.54) between x=−∞ and x=0 (with
ω˙ =0):
EF
(cid:18) (cid:19)
1
Θ= 1− ex/δ (2.56)
β
For x > 0, the solution is searched under the form 1 − Θ = beΓx. The resolution is
straightforward and gives:
1
" (cid:18)
R δ
(cid:19)1/2 #
Γ= 1− 1+4 r (2.57)
2δ s
L
viiAnotherpossibilityusedbyEchekkiandFerziger156 istowriteω˙EF =ρRr(1−Θ)H(Θ−Θc)andlaterto
assumethatλ=λ1T T
1
sothatρλisconstant(seeTable2.3). Inbothcases,Λ1 isconstant. Thisderivationis
given in more detail here so that the reader can understand why asymptotic or analytical techniques require
assumptionsontransportcoefficients: inmostcases,theseassumptionsareneededtomakeflameparameters
suchasΛ1 constantandarethereforedirectlylinkedtotheformsassumedforthereactionratesasshownin
Table2.3.

## 페이지 61
48 CHAPTER 2. LAMINAR PREMIXED FLAMES
and
1
Θ=1− eΓx (2.58)
β
By construction, the two temperature profiles of Eq. (2.58) and (2.56) are continuous at
x=0. By writing that their derivatives are continuous at x=0, the value of R is obtained:
r
s s2
R =β(β−1) L =β(β−1) L (2.59)
r δ D1
th
An explicit expression for flame speed is also derived:
(cid:18)
1 λ R
(cid:19)1/2
1 1−β
s = 1 r = (D1 R )1/2 and Γ= (2.60)
L β(β−1)ρ C (β(β−1))1/2 th r δ
1 p
This solution may be used to initialize a premixed flame propagating at speed s with an
L
activation temperature corresponding to β as shown in Table 2.4. Fig. 2.10 displays profiles
of reduced reaction rate ω˙ /(ρ Y1B ) versus Θ for an Arrhenius expression and for the EF
F 1 F 1
model. The rate constants B (for the Arrhenius form) and R (for the EF model) are chosen
r
to give the same flame speed: this is the case when R =2B/βexp(−β/α) (from Table 2.5).
r
Fig.2.11comparestheprofileobtainedusingthismodelwithaprofileobtainedfromtheexact
integration of Eq. (2.36) for α=0.75 and β =8. The agreement is satisfactory.
Comparing the expressions of flame speed for the EF model (Eq. (2.60)) and for an Ar-
rhenius form (Eq. (2.50)) reveals similar dependences:
s ∝(D1 R )1/2 (2.61)
L th r
In both models, the flame speed varies like the square root of the diffusion coefficient and
the square root of the reaction rate coefficient. This simple information is often useful to
understand the response of flame codes to changes in transport or chemistry models.
The thickness of the reaction rate zone in Θ space for this flame is 1/β by construction.
The maximum value of the reaction rate is obtained at x = 0 and Θ = Θ = 1−1/β and
c
is ρ (β−1)s2/D1 . The integral of the reaction rate ( R+∞ ω˙ dx) is ρ s as expected (see
1 L th −∞ EF 1 L
Eq. (2.24)).
Summary of simple flame speed expressions
The two previous sections have presented some basic results relating to laminar premixed
flames which can be obtained by analytical means. Many more studies have been devoted to
similarapproachesandprovideusefulresultsfornumericalcombustion. Table2.5summarizes
how asymptotic analysis may be used to predict flame speeds. In addition to the lean flame
cases presented here, the results of Van Kalmthout518 for flames where the reaction rate is
written B
1
ρY
F
Y
O
e−Ta/T are also presented.

## 페이지 62
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 49
Choose:
Flame speed s , activation temperature T
L a
Final temperature T , initial temperature T
2 1
Inlet velocity u
1
Estimate:
Rate parameters α=(T −T )/T and β =αT /T
2 1 2 a 2
Flame thickness: δ =D1 /s
th L
Compute reduced temperature profiles: Θ= T−T1
T2−T1
for x<0: Θ=(1−1/β)ex δ and for x>0: Θ=1−1/βe(1−β)x δ
Initialize temperature:
T(x)=Θ(T −T )+T
2 1 1
Initialize velocity field:
u(x)=u +s αΘ/(1−α)=u +s (T/T −1)
1 L 1 L 1
Fix adequate rate values:
For present model: ω˙ =ρ R (1−Θ)H(Θ−Θ ) with R =β(β−1)s2/D1
F 1 r c r L th
For Arrhenius: ω˙
F
=B
1
T
1
βρY
F
e−Ta/T with |B
1
|T
1
β =(s2
L
β2eβ/α)/D
t
1
h
Table 2.4: Analytical initialization of a premixed flame using a simplified rate model. The inlet
speed u may differ from the flame speed s . The velocity field is given by Eq. (2.104).
1 L
1.0
0.8
0.6
0.4
0.2
0.0
θ
erutarepmet
decudeR
θ=θ = 1-1/ β
c
Arrhenius form
Echekki Ferziger model
-5 -4 -3 -2 -1 0 1 2
Reduced abscissa (x/δ)
Figure 2.11: Comparison of temperature profiles obtained with Arrhenius and EF models.

## 페이지 63
50 CHAPTER 2. LAMINAR PREMIXED FLAMES
s
deeps
emalF
tropsnarT
etar
noitcaer
leuF
ledoM
L
snoitpmussa
)22.2(
.qE
ni
ω˙
F
2/1)
h 1 t D1β
1
T|
1
B|2(α
β 2 −e
β 1
1β−1)
1 T/T(
1
λ=λ
T/aT−e
F Yρ1βT
1 B
KFZ
)α3−
β 43.1
+1(2/1)
h 1 t D1β
1
T|
1
B|2(α
β 2 −e
β 1
1β−1)
1 T/T(
1
λ=λ
T/aT−e
F Yρ1βT
1 B
smailliW
2/1)
β 2 h 1 t D1
O
Y|
1
B|2(α
β 2 −e
β 1
1
T/T
1
λ=λ
T/aT−e
O
Y F
Yρ 1 B
tuohtmlaK
naV
2/1(cid:17)
(cid:16)
R
1D
1
T/T
λ=λ
)
Θ−Θ(H)Θ−1(
Rρ
ikkehcE
r
ht
)1−β(β
1
1
c
r
2/1(cid:17)
(cid:16)
R
1D
1
λ=λ
)
Θ−Θ(H)Θ−1(
R ρ
koob
sihT
r
ht
)1−β(β
1
c
r 1
nael
rof
sledom
lacitylana
dna
citotpmysa
elpmis
emos
gnisu
stluser
deeps
emafl
dna
snoitpmussa
fo
yrammuS
:5.2
elbaT
T
erutarepmet
mumixam
ehT
.)evitagen
si
B(
ω˙Q−
=
ω˙
yb
ω˙
ot
deknil
si
ω˙
etar
noitcaer
erutarepmet
ehT
.semafl
2
1
F
T
F
T
yb
deniatbo
era
β
dna
α
stneicffieoc
ehT
.sag
hserf
eht
ni
noitcarf
ssam
leuf
eht
si
1Y
erehw
C/1YQ+
T=
T yb
nevig
si
F
p
F
1
2
nav
eht
roF
.β/1−1=
Θ :erutarepmet
lacitirc
eht
si
Θ
.noitcnuf
edisivaeH
eht
si
H
. T/
Tα=
β
dna
T/)
T−
T(=α
c
c
2
a
2
1
2
.)815tuohtmlaK
naV(
sesag
hserf
eht
ni
noitcarf
ssam
rezidixo
eht
setangised
1Y
,stluser
tuohtmlaK
O

## 페이지 64
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 51
2.4.6 Generalized expression for flame speeds
Mitani357 also derived a more general expression for flame speeds which is not as explicit as
theformulaeofTable2.5butcoversmorecases(Williams554)andcanhandlenon-unityLewis
number reactants. Consider a global reaction:
ν0 F +ν0 O →P (2.62)
F O
for which the fuel consumption rate is given by:
(cid:18)
ρY
(cid:19)nF (cid:18)
ρY
(cid:19)nO (cid:18)
T
(cid:19)
ω˙ =ν0 W B Tβ1 F O exp − a (2.63)
F F F 1 W W T
F O
Where the reaction exponents n and n are not necessarily equal to ν0 and ν0 . The
F O F O
equivalenceratioisφ=sY
F
1/Y
O
1 =(ν
O
0 W
O
Y
F
1)/(ν
F
0 W
F
Y
O
1). TheproductλρB
1
Tβ1 isassumed
to be constant. This is the case for example when λ=λ
1
(T/T
1
)1−β1 as in Table 2.5.
If Le and Le are respectively the fuel and the oxidizer Lewis numbers, the flame speed
F O
obtainedbyafirst-orderanalysisforleanflame(φ<1)is(indices1correspondtofreshgases
while 2 indicate burnt quantities):
s =
" 2λ
2
ν
F
0 (ν
O
0 /ν
F
0 )nOρn
2
F+nOB
1
T
2
β1Y
F
n
,
F
1
+nO−1Len
F
FLen
O
O #1/2
·
L ρ2 1 C p W F nF+nO−1βnF+nO+1 (2.64)
(cid:18) (cid:19)
β
G(n ,n )1/2exp −
F O 2α
where the G function is defined by:
Z ∞ (cid:18) φ−1 (cid:19)nO
G(n
F
,n
O
)= ynF y+β
Le
e−ydy (2.65)
0 O
For a rich flame, this formula is still valid if indices F and O are inverted. In general,
the accuracy of such expressions is reasonable for lean mixtures but poor for rich cases. An
equivalent expression of Eq. (2.64) can be obtained by replacing λ ρ B Tβ1 by λ ρ B Tβ1:
2 2 1 2 1 1 1 1
s =
" 2D
t
1
h
ν
F
0 (ν
O
0 /ν
F
0 )nOB
1
T
1
β1Len
F
FLen
O
O (cid:18) ρ
2
Y
F,1
(cid:19)nF+nO−1 #1/2
·
L βnF+nO+1 W
F (2.66)
(cid:18) (cid:19)
β
G(n ,n )1/2exp −
F O 2α
For n =1, ν0 =1 and n =0 and unity Lewis numbers, G(n ,n )=1 and Eq. (2.66)
F F O F O
leads to the expression (2.49).

## 페이지 65
52 CHAPTER 2. LAMINAR PREMIXED FLAMES
0.7
0.6
0.5
0.4
0.3
0.2
0.1
0.0
)s/m(
deeps
emalF
Numerical solution
Experiments
Asymptotic solution
0.6 0.8 1.0 1.2 1.4
Equivalence ratio φ
Figure 2.12: Flame speeds for a methane/air mixture as a function of equivalence ratio.
Table 2.6 shows how this expression must be used for a lean hydrocarbon/air flames.
Fig. 2.12 gives an example of flame speed computations for a methane/air flame modeled by
a single step reaction:
CH +2O →CO +2H O (2.67)
4 2 2 2
The following set of parameters was used:
B =1.08 107 uSI; β =0; E =83600 J/mole; n =1; n =0.5; (2.68)
1 1 a F O
ρ =1.16 kg/m3; λ =0.038 W/mK; Q=50100 kJ/kg; C =1450 J/(kgK) (2.69)
1 1 p
The preexponential constant B was fitted to match the flame speed measured at φ=0.8.
1
Fig. 2.12 shows that the asymptotic formula provides a fair estimate of the flame speed with
an error margin of the order of a few percent on the lean side and of 20 percent on the
rich side compared to a numerical resolution of the conservation equation. When compared
to experimental results (Yamaoka and Tsuji558), the asymptotic and the numerical solutions
provide good estimates on the lean side but fail on the rich side.

## 페이지 66
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 53
Choose thermodynamic data:
Molecular weights of fuel (W ) and oxidizer (W )
F O
Heat release per unit mass of fuel Q
Choose chemical reaction:
ν0 F +ν0 O→P
F O
Choose kinetic parameters:
Preexponential constant B , exponent β , activation temperature T
1 1 a
Reaction exponents n and n
F O
Choose transport parameters:
Heat diffusivity in fresh gas: λ
1
Fuel and oxidizer Lewis numbers: Le and Le
F O
Choose fresh gas characteristics:
Temperature T , density ρ , equivalence ratio φ
1 1
Compute intermediate quantities:
Stoichiometric ratio: s= ν O 0 WO
ν
F
0 WF
(cid:18) (cid:19)
s W
Fresh gas fuel mass fraction: Y =1/ 1+ (1+3.76 N2)
F,1 φ W
O2
Burnt gas temperature and density: T =T +QY /C and ρ =ρ T /T
2 1 F,1 p 2 1 1 2
α and β parameters: α=QY /(C T ) β =αT /T
F,1 p 2 a 2
Burnt gas heat diffusivity: λ
2
=λ
1
(T
2
/T
1
)1−β1
Integrate G factor: G(n
F
,n
O
)= R
0
∞ynF(y+β(φ−1)/Le
O
)nO)e−ydy
Compute flame speed:
s L =
(cid:20)
2λ2ν F 0 (ν O 0 /ν F 0 ρ )n 2
1
O Cp ρ W 2 nF
F
n + F n + O n B O 1 − T 1 2 β β 1 n Y F F n + , F 1 n + O n + O 1 −1Len F FLen O O
(cid:21)1/2
G(n F ,n O )1/2e− 2 β α
Table 2.6: Computing the speed of a lean flame in air using asymptotic results. The mixture
molecular weight is supposed to be constant.

## 페이지 67
54 CHAPTER 2. LAMINAR PREMIXED FLAMES
2.4.7 Single step chemistry limitations and stiffness of reduced
schemes
As seen in Fig. 2.12, using a single step reaction to describe premixed combustion provides
good results in the lean regime but very poor predictions for rich flames. This problem has
been recognized for a long time and may be fixed by using other set of values for the reaction
exponents n and n . Westbrook and Dryer547 proposed reduced schemes which provide
F O
reasonable flame speeds over a wide range of equivalence ratios. From a numerical point of
view, this is obtained by using small values of the reaction exponents, especially n . Such
F
small values may lead to numerical difficulties: decreasing reaction exponents (as often done
in many reduced schemes) leads to increased stiffness. This may be shown by considering a
flame where n =0 and changing n . Fig. 2.13 shows the variations of the reduced reaction
O F
rate of Eq. (2.37) in which a non-unity value for n would be used:
F
(cid:18) (cid:19)
ω˙ β(1−Θ)
Y F 1 =B 1 Tβ1e− α β ρ(1−Θ)nF exp − 1−α(1−Θ) (2.70)
F
The heat release is such that α=0.75 and the activation temperature corresponds to β =8.
The reduced reaction rate becomes a stiff function of the reduced temperature when small
values of n are used. For n = 0.2 and β = 8, the chemistry formulation is stiffer than it
F F
was for n = 1 and β = 20 (see Fig. 2.8). This explains why reduced schemes often lead to
F
numerical difficulties.
40x10-3
30
20
10
0
etar
noitcaer
decudeR
n f=0.2
n f=0.4
n f=1
0.0 0.2 0.4 0.6 0.8 1.0
Reduced temperature (T-T1) / (T2-T1)
Figure 2.13: Variations of the reduced reaction rate ω˙ /(ρ Y1B ) vs Θ for various values of n :
F 1 F 1 F
the problem becomes stiffer when n increases (β =0 and β =8).
F 1

## 페이지 68
2.4. THEORETICAL SOLUTIONS FOR LAMINAR PREMIXED FLAMES 55
2.4.8 Variations of flame speed with temperature and pressure
Eq. (2.66) may also be used to evaluate the dependence of flame speed with pressure P or
fresh gas temperature T . For example, the thermal diffusivity D1 scales like 1/P while the
1 th
burntgasdensityρ scaleslikeP sothat,foraconstantfreshgastemperatureT ,thelaminar
2 1
flame speed s at pressure P is roughly linked to its value at P by:
L 0
(cid:18) (cid:19)nF+nO−2
P 2
s (P)=s (P0) (2.71)
L L P0
TemperaturechangesaremoredifficulttoanticipatebecausetheexponentialterminEq.(2.66)
iscontrolledbytheburntgastemperatureT whichisnotwelldescribedusingsimplereaction
2
chemistry. Experimental results are usually expressed as simple polynomial functions:
(cid:18)
P
(cid:19)αP (cid:18)
T
(cid:19)αT
s (P,T )=s (P0,T0) 1 (2.72)
L 1 L 1 P0 T0
1
As an example, for usual values n = 0.1 and n = 1.65, as proposed by Westbrook
F O
and Dryer547) for lean propane/air flame, a theoretical pressure exponent α = −0.125 is
P
found from Eq. (2.71) and is consistent with the value proposed by Metghalchi and Keck354
(Table 2.7).
Table 2.7 gives examples of values for the parameters used in Eq. (2.72) obtained for
methane/air combustion by Gu et al.196 (1≤P ≤10 bars, 300≤T ≤400 K, 0.8≤φ≤1.2)
1
andforpropane/airflamesbyMetghalchiandKeck354 (0.4≤P ≤50bars,300≤T ≤700K,
1
0.8≤φ≤1.5, data interpolated from Metghalchi’s paper).
Fuel s (P0,T0) (m/s) α α
L 1 T P
Methane (φ=0.8) 0.259 2.105 -0.504
Methane (φ=1) 0.360 1.612 -0.374
Methane (φ=1.2) 0.314 2.000 -0.438
Propane (φ=0.8 to 1.5) 0.34−1.38(φ−1.08)2 2.18−0.8(φ−1) −0.16−0.22(φ−1)
Table 2.7: ExamplesofexperimentalcorrelationsgivenbyEq.(2.72)formethane/air(Guetal.196)
and propane/air flames (Metghalchi and Keck354).
Flame speeds increase rapidly when the temperature of the fresh gases T increases but
1
decrease when pressure increases. Fig. 2.14 shows examples of flame speed variations for
methane-air and propane-air flames with fresh gas temperatures for different pressures ob-
tained with expression (2.72) and the parameters of Table 2.7.

## 페이지 69
56 CHAPTER 2. LAMINAR PREMIXED FLAMES
1.0
0.8
0.6
0.4
0.2
0.0
)s/m(
deeps
emalF
φ= 1, P=1 atm 1.0
φ= 1, P=5 atm
φ= 1, P=10 atm
0.8
0.6
0.4
0.2
METHANE - AIR
0.0
300 350 400 450 500
Fresh gas temperature (K)
)s/m(
deeps
emalF
φ= 1, P=1 atm
φ= 1, P=5 atm
φ= 1, P=10 atm
PROPANE - AIR
300 350 400 450 500
Fresh gas temperature (K)
Figure 2.14: Experimental fits for speeds of stoichiometric methane/air (Gu et al.196, left) and
propane/air flames (Metghalchi and Keck354, right).
2.5 Premixed flame thicknesses
Defining and estimating a flame thickness before computation is an obvious requirement for
many numerical combustion problems because this thickness controls the required mesh res-
olution: in most combustion approaches, the flame structure must be resolved and enough
points must be localized within the flame thickness. There are many ways to define thick-
nesses for premixed flames. Some of them require a first computation of the flame front
(for example in a one-dimensional configuration) while others are based only on scaling laws
and can be performed before computations start. It is also necessary to distinguish between
thicknesses defined for variables such as temperature, which are useful in simple chemistry
approaches (§ 2.5.1), and thicknesses corresponding to radicals, which raise very different
problems (§ 2.5.2).
2.5.1 Simple chemistry
In Section 2.4.5, a flame thickness δ was introduced from scaling laws:
λ D1
δ = 1 = th (2.73)
ρ C s s
1 p L L
which can also be written as
δs
Re = L =1 (2.74)
f D1
th
where all quantities D1 = λ /(ρ C ), ρ , C and λ are evaluated in the fresh gases. Re
th 1 1 p 1 p 1 f
may be interpreted as a flame Reynolds number. The thickness δ (called here “diffusive”

## 페이지 70
2.5. PREMIXED FLAME THICKNESSES 57
thickness) may be evaluated easily before any computation as soon as the flame speed is
known. Inpractice,thisthicknessmaybetooapproximatetobeusedformeshdetermination
(it is usually too small by a factor of order 5). A more useful thickness is obtained by using
the temperature profile and computing:
T −T
δ0 = 2 1 (2.75)
L max (cid:0)(cid:12) (cid:12) ∂T(cid:12) (cid:12) (cid:1)
∂x
STATE 1: fresh gas STATE 2: burnt gas
)2T-T(/)1T-T(
erutarepmet
decudeR
1
0
o
δL Abscissa
t
δL
Figure 2.15: Definitions of flame thicknesses for a premixed flame.
Anotherthickness(“totalthickness”)δt maybeconstructedbydefiningthedistanceover
L
whichthereducedtemperatureΘchangesfrom0.01to0.99(seeFig.2.15). δt isalwayslarger
L
than δ0 and not very useful for computations: in real flames, slow reactions taking place in
L
the burnt gases (see for example Fig. 2.2) usually create a long temperature “tail” leading
to large values for δt which can be misleading if δt is used to determine the grid resolution.
L L
Since it measures temperature gradients, δ0 is the most appropriate thickness to consider for
L
mesh resolution.
The thickness δ0 requires a first flame computation. Being able to evaluate it before
L
computation is useful to determine mesh constraints. This can be achieved with correlations.
For example, Blint42 proposes the following evaluation for a flame thickness δb:
L
δb (λ/C )
L =2 p 2 (2.76)
δ (λ/C )
p 1
If a Sutherland law is used for λ (supposing a constant Prandtl number (Eq. (1.17)) and a

## 페이지 71
58 CHAPTER 2. LAMINAR PREMIXED FLAMES
constant C ), this relation may be simplified:
p
δb (cid:18) T (cid:19)0.7 D1 (cid:18) T (cid:19)0.7 (cid:18) T (cid:19)0.7
L =2 2 or δb =2 th 2 =2δ 2 (2.77)
δ T L s T T
1 L 1 1
The thickness δb given by Eq. (2.77) does not require a flame computation and is a fairly
L
good estimation of the flame thickness δ0 as soon as the final temperature T is known. This
L 2
temperature T is also obtained without full flame computation, simply by thermochemistry
2
equilibrium as shown in Eq. (2.28). Note that, once a value is obtained for δ0, a resolution
L
adapted to the thickness of the reaction rate zone δ is still required. These two zones are
r
roughlylinkedbyδ =δ0/β. Table2.8summarizesthedifferentdefinitionsofthicknessesand
r L
how they may be estimated before or after computation.
From temperature profiles
(after a computation)
(cid:0)(cid:12) (cid:12)(cid:1)
Thermal thickness δ L 0 (T 2 −T 1 )/max (cid:12)∂ ∂ T x (cid:12) Best definition
Global thickness δt distance from Θ=0.01 to 0.99 Not useful
L
From the knowledge of s and of fresh gases properties
L
(before a computation)
Diffusive thickness δ D1 /s Not precise, too small
th L
Blint thickness δb 2D1 /s (T /T )0.7 =2δ(T /T )0.7 Close to δ0
L th L 2 1 2 1 L
Reaction thickness δ δ0/β Smallest thickness
r L
Table 2.8: Flame thickness definitions and usefulness to determine the mesh size in a code.
2.5.2 Complex chemistry
The previous section provides useful estimates of flame thicknesses when computations are
performed for simple chemistry schemes (Fuel → Products) in which the computation does
not have to account for any intermediate radical. In real flames and in all computations
using complex chemistry descriptions, many radicals are found within the flame front. These
radicalsmayexistoverdistancesmuchsmallerthanδ0: forexample,inFig.2.2,radicalssuch
L
as H O live in zones which are extremely thin. Defining mesh resolution in such flows is an
2 2
open question at the moment for which no a priori mesh estimations may be obtained. In
one-dimensionalstationaryflames,adaptivemeshesareused;butinmulti-dimensionalflames,
a trial and error technique is still used by many researchers.

## 페이지 72
2.6. FLAME STRETCH 59
2.6 Flame stretch
Up to now, only freely propagating one-dimensional premixed flames have been considered in
this chapter. Additional notions are needed to study multi-dimensional laminar flames and
turbulent flames. The first one is flame stretch which is defined in this section. Extended
flame speed definitions are given in Section 2.7.1.
2.6.1 Definition and expressions of stretch
The flame stretch is defined by the fractional rate of change of a flame surface element A
(Matalon and Matkowsky339, Candel and Poinsot83):
1 dA
κ= (2.78)
A dt
A flame front propagating in a non-uniform flow is subject to strain and curvature effects
whichleadtochangesinflamearea(Williams554). Thesechangesaremeasuredbystretch. A
generalexpressionofstretch may be developedfora thinflame sheet(Candel andPoinsot83):
κ=−~n ~n:∇w~ +∇·w~ (2.79)
where~nistheunitvectornormaltotheflamesurfacepointingtowardsthefreshgasesandw~
is the velocity of the flame surface (Fig. 2.16). The operator (~n~n:∇) represents the gradient
operator normal to the flame surface and may be written in index form as:
(cid:20) (cid:21)
∂w
~n~n:∇w~ = n n i (2.80)
i j∂x
j
so that, in tensor notation, κ is also written:
∂w
κ=(δ −n n ) i (2.81)
ij i j ∂x
j
The flame propagates normally to the cold flow (wave behavior) at a displacement speed
s (see§2.7.1foranexactdefinitionofflamespeeds). Theflamefrontvelocitymaybewritten
d
in terms of the unburned gas velocity ~u and the displacement speed as follows:
w~ =~u+s ~n (2.82)
d
The difference between the flame front velocity w~ and the flow velocity ~u is the displace-
ment speed s ~n which takes into account the effects of the flow on the flame structure itself.
d
Substituting Eq. (2.82) into Eq. (2.79) yields:
κ=−~n~n:∇~u+∇·~u + s (∇·~n) (2.83)
d

## 페이지 73
60 CHAPTER 2. LAMINAR PREMIXED FLAMES
Figure 2.16: Definition of flame stretch and flame radii of curvature.
or, in index form:
∂u ∂n
κ=(δ −n n ) i + s i (2.84)
ij i j ∂x d ∂x
j i
The term ∇·~n has a simple physical interpretation. It is the curvature of the flame front
and is linked to the flame surface radii of curvature R and R by:viii
1 2
(cid:18) (cid:19)
1 1
∇·~n=− + (2.85)
R R
1 2
Butthenotation∇·~nusedinEq.(2.83)canbemisleading: takingthedivergenceofavector~n
whichisdefinedonlyalongtheflamesurfacerequiressomecaution.ix Foracylindricalpocket
of fresh gases of radius R surrounded by burnt gases (Fig. 2.17a), ∇·~n can be evaluated in
viii1/R1and1/R2arethetwomain(orprincipal)curvaturesoftheflamesurface. Thesecurvaturesmeasure
respectivelythehighestsurfacecurvatureandthesurfacecurvatureintheperpendiculardirection. Forexam-
ple, for a cylinder of radius R, R1 =R and R2 =∞ (1/R2 =0); for a sphere of radius R, R1 =R2 =R;
maincurvaturesforasaddlepointhaveoppositesigns.
ixIntwodimensionsandcartesiancoordinates,thevector~nnormaltoiso-levelsofafieldA(x,y)is:
∇A ∂A (cid:20)(cid:16)∂A(cid:17)2 (cid:16)∂A(cid:17)2 (cid:21)−1/2 ∂A (cid:20)(cid:16)∂A(cid:17)2 (cid:16)∂A(cid:17)2 (cid:21)−1/2 !
~n=− =(nx,ny)= − + , − +
|∇A| ∂x ∂x ∂y ∂y ∂x ∂y
where~nispointingtowardsthelowervaluesoftheA-field. Then:
∇·~n=
∂nx
+
∂ny
=−
(cid:20)(cid:16)∂A(cid:17)2
+
(cid:16)∂A(cid:17)2 (cid:21)−3/2(cid:20) ∂2A(cid:16)∂A(cid:17)2
+
∂2A(cid:16)∂A(cid:17)2 (cid:21)
∂x ∂y ∂x ∂y ∂x2 ∂y ∂y2 ∂x
Alongafrontdefinedbycoordinates(x,f(x))(orA(x,y)=y−f(x)=0):
∂A ∂2A ∂A ∂2A
=−f0(x) ; =−f00(x) ; =1 ; =0
∂x ∂x2 ∂y ∂y2
andthelocalfrontcurvatureisgivenby∇·~n=f00/(1+f02)3/2.

## 페이지 74
2.6. FLAME STRETCH 61
cylindrical coordinates (n =−1 and n =0):
r θ
1∂(rn )
∇·~n= r =−1/R
r ∂r
which is consistent with Eq. (2.85). The contribution of s ∇·~n to stretch in Eq. (2.83) in
d
this case is negative: flame propagation decreases stretch and diminishes the flame surface.
Similarly, for a spherical flame (Fig. 2.17b), ∇·~n is (in spherical coordinates):
1 ∂(r2n )
∇·~n= r =−2/R
r2 ∂r
Burnt
gases Burnt
Fresh gases gases
Fresh gases
(a) Cylindrical flame (b) Spherical flame
Figure 2.17: Pockets of fresh gases surrounded by cylindrical or spherical flames and burnt gases:
in both cases, the curvature term ∇·~n brings a negative contribution to stretch in Eq. (2.83).
The first two terms on the RHS of Eq. (2.83) are often grouped to have (Candel and
Poinsot83):
κ=(m~ m~ +~p~p):∇~u+s (∇·~n) (2.86)
d
where m~ and~p are two orthonormal vectors belonging to the local tangent plane of the flame
(Fig.2.16). Theterm(m~ m~ +~p~p):∇~uinEq.(2.86)representsthestrainintheplanelocally
parallel to the flame front and is sometimes written (Chung and Law100) as ∇ ·~u where the
t
subscript t refers to the tangential component of the ∇ operator:
∇ ·~u=(m~ m~ +~p~p):∇~u=−~n~n:∇~u+∇·~u (2.87)
t
The ∇ operator can also be used to express the second term in the RHS of Eq. (2.86):
t
∂n
∇ ·~n = (m~ m~ +~p~p):∇~n=(δ −n n ) i
t ij i j ∂x
j
∂n ∂n ∂n 1 ∂
= δ i −n n i = i − n (n n )=∇·~n (2.88)
ij∂x i j∂x ∂x 2 j∂x i i
j j i j
because ~n is an unity vector.

## 페이지 75
62 CHAPTER 2. LAMINAR PREMIXED FLAMES
From the above considerations, Eq. (2.86) is re-written as follows:
(cid:18) (cid:19)
1 1
κ=∇ ·~u−s + =∇ ·~u+s ∇ ·~n (2.89)
t d R R t d t
1 2
In Eq. (2.89), the flame stretch is the sum of two terms:
• the first term, ∇ ·~u, is a strain term and is related to the flow non-uniformity,
t
• the second one, s ∇ ·~n = −s (1/R +1/R ), is a term due to the curvature of the
d t d 1 2
reaction front.
2.6.2 Stretch of stationary flames
A flame is stationary if it does not propagate along its normal direction ~n:
w~.~n=0 (2.90)
This condition does not imply that the velocity w~ is zero: a velocity can exist in the
plane tangent to the flame (see for example the single or the twin stagnation point flames in
Fig. 2.20). For a stationary flame Eq. (2.82) and (2.90) show that~u·~n=−s and the stretch
d
factor reduces to:
κ=∇ ·~u+s ∇ ·~n=∇ ·(~u−(~u·~n)~n)=∇ ·~u (2.91)
t d t t t t
where ~u is the tangential component of the unburned gas velocity (Chung and Law100).x
t
2.6.3 Examples of flames with zero stretch
Flames can be curved or placed in velocity gradients and still be unstretched. This section
presents two examples of such flames.
The steady cylindrical (or spherical) premixed flame
Consider first a steady cylindrical (or spherical) flame, fed centrally by a fresh gas injector
(Fig. 2.18). After some initial displacement, this flame would stabilize itself at a fixed dis-
tance from the injectors. The absolute flame speed is zero. Obviously, the flame surface
xEq.(2.91)isderivedstartingfrom∇t·~u−∇t·~ut:
∂
∇t·~u−∇t·~ut=∇t·(~u−~ut)=∇t·[(~u·~n)~n]=−(δij−ninj)
∂xj
[s
d
ni]
(cid:18) (cid:19)
=−s
d
∂
∂
n
xi
i − 1
2
nj ∂
∂
n
x
in
j
i −nj
∂
∂
x
s d
j
+nininj
∂
∂
x
s d
j
=−s
d
∇·~n= s
R
d
because~nisanunityvector.

## 페이지 76
2.6. FLAME STRETCH 63
is constant and its stretch is zero even though it is curved. Actually, strain and curvature
terms compensate in Eq. (2.89). For the cylindrical flame of radius R written in cylindrical
coordinates:
s ∂u 1∂(ru ) s u s
κ=∇ ·~u+s ∇ ·~n=−~n~n:∇~u+∇·~u− d =− r + r − d = r − d =0 (2.92)
t d t R ∂r r ∂r R r R
becauseu isequaltos forthissteadyflame. AsimplerwaytocheckthisistouseEq.(2.91)
r d
in which ~u is zero so that κ is also zero.
t
Burnt
Fresh gases gases
Steady flame front
Figure 2.18: Cylindrical or spherical steady flame: the flame stretch is zero.
For the spherical flame of radius R, the same derivation leads to:
∂u 1 ∂(r2u ) 2s 2 2s
κ=∇ ·~u+s ∇ ·~n=− r + r − d = u − d =0 (2.93)
t d t ∂r r2 ∂r R r r R
The planar flame in a shear flow
Another situation where flames are unstretched is displayed in Fig. 2.19. The orientation
of flame fronts relative to velocity gradients is a critical parameter for flame stretch: only
velocity gradients in the flame tangent plane induce flame stretch. The steady planar flame
of Fig. 2.19 is submitted to a one-dimensional velocity gradient. This situation is typical of
flames created in mixing layers and stabilized behind a splitter plate. For this flame, n =0,
1
n =1,u=(u (x ),0). Eq.(2.91)showsthatflamestrainiszerobecausethevelocitygradient
2 1 2
has no component in the flame plane. A usual error is to assume that flame strain in such a
configuration is estimated by ∂u /∂x .
1 2
2.6.4 Examples of stretched flames
Fig. 2.20 presents usual configurations to study laminar stretched flames experimentally or
numerically. The first one (Fig. 2.20a) is the single flame in which hot combustion products
(usually produced by another flame) are sent against a flow of fresh gases. In this case, the
flame is stretched because the velocity in the flame tangent plane changes rapidly (first term
∇ ·~u in Eq. (2.89)). For a non reacting potential flow, the stagnation point configuration
t
has a simple analytical solution: u = ax and v = −ay where a is the strain rate. For a flow
between two injectors, a is imposed by the flow velocities U1 and U2 of the two jets and the
j j

## 페이지 77
64 CHAPTER 2. LAMINAR PREMIXED FLAMES
u = (u1(x2),0)
x2
n
Splitter
plate Flame front
x1
Figure 2.19: Stretch in a mixing layer: the flame strain is zero.
distancedbetweenthejets. Inreactingflows, itdependsontheflamestructureitselfbecause
of dilatation and is typically of order (|U1|+|U2|)/d. The single flame has been studied by
j j
multiple researchers (numerically for complex chemistry, with asymptotic methods for simple
chemistry and experimentally). Its main drawback is that the temperature of the combustion
products controls the solution.
The twin flame configuration (Fig. 2.20b) has no such drawback: by blowing fresh gas
against fresh gas, two flames are established. Twin flames are much more sensitive to strain
as described below.
Finally, the spherical flame has no velocity gradient in the flame tangent plane but is
curved(Fig.2.20c): stretchisproducedherebythesecondterm∇ ·~n=2s /RinEq.(2.89).
t d
Stretch is also easily measured in such flames by measuring the changes of flame radius with
time r(t):
1 dA 2dr
κ= = (2.94)
A dt r dt
Intuition is not always helpful to understand stretched flames: the spherical flame is ob-
viously growing since its radius increases with time so that its stretch must be positive. For
stagnation point flames, the flame area seems constant but stretch is indeed present: two
points located in the flame plane separate from each other because their velocities in the
flame plane are different; the flame element located between these two points is stretched.

## 페이지 78
2.6. FLAME STRETCH 65
Figure 2.20: Examples of laminar stretched premixed flames.

## 페이지 79
66 CHAPTER 2. LAMINAR PREMIXED FLAMES
2.7 Flame speeds
The“speed”ofaflameisacentralelementincombustiontheory. Itisalsothesourceofmany
difficultiesbecausetherearemultipledefinitionsforflamespeedsandmultiplewaystomeasure
them. Section 2.7.1 provides a general framework to define flame speeds while Section 2.7.2
showshowthesedefinitionsapplyinaplanarunstrainedflame. Section2.7.3discussesspeeds
of stretched flames and points out difficulties associated to such configurations.
2.7.1 Flame speed definitions
The notion of a flame speed s was used up to now without further precision, by first stating
L
that this velocity measured the speed at which the flame front was moving with respect to
the fresh gases in a one-dimensional geometry. This definition is used intuitively by most
researchers and corresponds to a description of the flame as an interface moving at speed s
L
against the local flow. Later it was also shown (see Eq. (2.24)) that this flame speed may also
be defined from the integral of the burning rate across the flame brush:
1 Z +∞
s =− ω˙ dx (2.95)
L ρ Y1 F
1 F −∞
These notions, one based on kinematic properties of the flame and the other based on the
integral of the reaction rate, must be connected to understand many of the recent concepts
used in premixed combustion theories. This is done in the following derivation.
First, it is necessary to introduce three flame speed definitions (Trouv´e and Poinsot511,
Poinsotetal.416)summarizedinTable2.9andtodistinguishbetweenlocalandglobalspeeds:
Identification Definition
Absolute Flame front speed relative to a fixed reference frame
Displacement Flame front speed relative to the flow
Consumption Speed at which reactants are consumed
Table 2.9: Simple classification of flame speeds.
Even though these definitions may seem equivalent or, at least, directly connected, it is
not always the case and multiple differences between these definitions are evidenced below:
• Let us first consider a point on the flame surface, Θ = Θ (Fig. 2.21). At any location
f
on this surface, the local gradient of Θ defines the normal to the flame front:
∇Θ
~n=− (2.96)
|∇Θ|

## 페이지 80
2.7. FLAME SPEEDS 67
Figure 2.21: Notations for flame speed definitions.
where ~n points into the fresh reactants. The velocity w~ at which this point must move
to remain on the surface is given by:
∂Θ
+w~.∇Θ=0 (2.97)
∂t
The velocity component normal to the flame front s = w~.~n is the absolute speed at
a
which an isolevel of temperature moves relative to the laboratory frame. It depends on
thevalueoftheisolevelΘ whereitismeasured. Replacing∇Θby−|∇Θ|~ninEq.(2.97)
f
implies that:
1 ∂Θ
s =w~.~n= (2.98)
a |∇Θ| ∂t
The absolute speed is usually constant through the flame front if the flame is not being
thickened or thinned by the flow. This is simply due to the fact that all isolevels must
move at the same speed if the thickness remains constant.
• The displacement speed measures the front speed relative to the flow i.e. the difference
between the flow speed ~u and the front speed w~:
s =(w~ −~u).~n=s −~u.~n (2.99)
d a
and can be obtained in simulations by:
1 ∂Θ ∇Θ 1 DΘ
s =w~.~n−~u.~n= +~u = (2.100)
d |∇Θ| ∂t |∇Θ| |∇Θ| Dt
where the quantities are evaluated at the surface Θ=Θ . The RHS terms of Eq. (2.98)
f
or (2.100) are easily measured in a computation as they are the terms used in the time
advancement for explicit schemes. For example, using Eq. (2.3), Eq. (2.100) may be
written:
" (cid:18) (cid:19) N !#
1 DΘ 1 ∂ ∂T ∂T X
s = = ω˙0 + λ − ρ C Y V (2.101)
d |∇Θ| Dt ∇Θ T ∂x ∂x ∂x p,k k k
i
k=1

## 페이지 81
68 CHAPTER 2. LAMINAR PREMIXED FLAMES
where all terms are available from the computation. This property is often used in
DNS to evaluate flame front displacements (§ 4.6). Like the absolute speed s , the
a
displacement speed is a function of the isolevel Θ where it is measured. It is a difficult
f
speed to use: since the flow accelerates through the flame front, the displacement speed
changes too and depends on the position where it is measured. However, it is a useful
quantityinmodelsbasedforexampleontheGequationinwhichthestrategyistomove
the flame relative to the flow (Peters397).
• A third speed is the consumption speed s based only on reaction rates and defined by
c
Eq. (2.95):
1 Z +∞
s =− ω˙ dn (2.102)
c ρ Y1 F
1 F −∞
It measures the speed at which the flame burns the reactants.
An important difference between these speeds is that s or s are local quantities de-
d a
pending on the isolevel Θ where they are evaluated while s is a quantity resulting from an
f c
integral over all Θ values across the flame front (Table 2.10). The speed used intuitively by
f
experimentalists is the displacement speed measured on the fresh reactant side: s (Θ = 0).
d
The following sections compare all speeds in different flames.
Identification Definition Formula Characteristics
Consumption s =− 1
R+∞ω˙
dn Global
c ρ1Y
F
1 −∞ F
Displacement (w~ −~u).~n s = 1 DΘ Local: s (Θ )
d |∇Θ| Dt d f
Absolute w~.~n s = 1 ∂Θ Local: s (Θ )
a |∇Θ| ∂t a f
Table 2.10: Flame speeds definitions. The normal ~n points into the fresh reactants.
2.7.2 Flame speeds of laminar planar unstretched flames
Thespeedofalaminarplanarunstretchedfreelypropagatingone-dimensionalflames0 isthe
L
reference speed for all combustion studies. Even for such a flame, differences exist between
speeds as demonstrated here. Fig. 2.22 presents the variations of all speeds for a planar
unstretched flame where the inlet flow velocity u is not equal to s0: in this case, the flame
1 L
moves in the laboratory frame. The consumption speed s is equal to s0. The x axis points
c L
towards the burnt gas so that ~n = −~x. The inlet speed is ~u = −u ~n. All speeds are
1 1
normalizedbythelaminarflamespeeds0. Becausetheflamepropagatesmoreslowlythanthe
L
flowforthisexamplewhereu >s0,theflamefrontgoesbackwardstowardspositivexvalues.
1 L
The absolute speed of all isolevels is the same because the flame is convected away without

## 페이지 82
2.7. FLAME SPEEDS 69
becoming thinner or thicker: w~ =(u −s0)~x. The absolute speed is s =w~.~n=s0 −u and
1 L a L 1
is negative.
8
6
4
2
0
-2
sdeeps
dezilamroN
Displacement speed of isolevel
Flow velocity
Absolute speed of isolevel
0 20 40 60 80 100 120
Distance along normal to flame front
Figure2.22: Variationsofflow,displacement,absoluteandconsumptionspeedsinaone-dimensional
planar laminar flame. For this example, the inlet speed u is fixed to 2.5s0.
1 L
Todeterminetheflowvelocity, thecontinuityequation(2.21)isused. Itexpressesthat, in
the flame reference frame, the mass flow rate is conserved along ~n and equal to the inlet flow
rate.
ρ(~u−w~).~n=ρ (~u −w~).~n (2.103)
1 1
so that u at each point is given by:
(cid:18) (cid:19)
ρ ρ
u=−~u.~n=−s +(u +s ) 1 =u +s0 1 −1 (2.104)
a 1 a ρ 1 L ρ
The density ratio ρ /ρ is also T/T or 1+αΘ/(1−α) where Θ and α are respectively defined
1 1
by Eq. (2.31) and Eq. (2.38). The flow accelerates through the flame front passing from a
velocity u to u +s0α/1−α. The displacement speed measures the difference between the
1 1 L
flame and the flow speeds:
(cid:18) (cid:19)
ρ αΘ
s (Θ)=s −~u.~n=s0 1 =s0 1+ (2.105)
d a L ρ L 1−α
It is positive because the flame propagates against the flow (even though it is moving back-
wards in the reference frame and s is negative). It reaches s0/(1−α) in the burnt gases.
a L
Furthermore, the displacement speed is equal to the flame speed (to s0 actually in this case)
L
only when Θ is small, i.e. when s measures the displacement speed of an isolevel located
f d
close to the fresh gases. Table 2.11 summarizes these results.

## 페이지 83
70 CHAPTER 2. LAMINAR PREMIXED FLAMES
Consumption Absolute Displacement
speed s speed s (Θ) speed s (Θ)
c a d
s0 −u +s0 s0(1+αΘ/(1−α))
L 1 L L
Table 2.11: Flame speeds in a planar unstretched flame. u is the flow velocity ahead of the flame.
1
Θ is the reduced temperature (Eq. (2.31)) and α measures the heat release (Eq. (2.38)).
2.7.3 Flame speeds of stretched flames
Theplanarunstretchedflameconstitutesoneofthefewflameswhereallspeedscanbeunam-
biguously defined and measured. If the flame is stretched (curved or strained or both), flame
speeds may take different values and be more difficult to evaluate, both experimentally and
numerically. The only theoretical guide to study the speeds of stretched flames comes from
asymptotic theories (Bush and Fendell74, Buckmaster and Ludford70, Williams554, Pelce and
Clavin393,ClavinandWilliams107,Clavin102). Thesestudiessuggestthat,inthelimitofsmall
strain and curvature terms, stretch κ is the only parameter controlling the flame structure
and therefore, the displacement and consumption speeds through a linear relationship:
s (0) Ld s Lc
d =1− aκ and c =1− aκ (2.106)
s0 s0 s0 s0
L L L L
where Ld and Lc are Markstein lengths. The displacement speed is defined on the fresh gas
a a
side (Θ=0). The two Markstein lengths differ, showing that the displacement speed and the
consumption speed react differently to stretch. Eq. (2.106) can also be recast as:
s (0) κδ s κδ
d =1−Md and c =1−Mc (2.107)
s0 as0 s0 as0
L L L L
where δ is the unstretched flame thickness defined by Eq. (2.55):
λ D1
δ = 1 = th (2.108)
ρ C s0 s0
1 p L L
Md =Ld/δandMc =Lc/δareMarskteinnumbersforthedisplacementandtheconsumption
a a a a
speeds respectively. The expression κδ/s0 is a reduced Karlovitz number. When it reaches
L
unity, quenching effects should appear so that the previous correlations are expected to hold
only for κδ/s0 << 1. Various expressions may be found for the Markstein numbers in the
L
literature. For constant viscosity, lean, single-step flames with variable density, Clavin and

## 페이지 84
2.7. FLAME SPEEDS 71
Joulin105 give: xi
Md = Ld a = T 2 ln (cid:18) T 2 (cid:19) + 1 β(Le −1) T 1 Z T2 T − 1 T1 ln(1+x) dx (2.109)
a δ T −T T 2 F T −T x
2 1 1 2 1 0
and Mc = Lc a = 1 β(Le −1) T 1 Z T2 T − 1 T1 ln(1+x) dx (2.110)
a δ 2 F T −T x
2 1 0
The parameter β is given by Eq. (2.38): β = (T −T )T /T2. It measures the activation
2 1 a 2
energy. ThesignofthedisplacementMarksteinlengthLd controlsthestabilityofthelaminar
a
flame fronts and may have also influence on turbulent flames: negative Markstein lengths
create a natural intrinsic front instability leading to cell formation (Williams554).
Even though the existence of a relationship between stretch and flame speeds has been
demonstrated only under restricted assumptions (single-step chemistry, high activation en-
ergy,smallstretch),itisthebasisofmostmodernflamestudies. Implicitly,mostexperimental
results are compiled assuming that flame stretch is the only parameter controlling the flame
structure even though certain results suggest that this may not necessarily be true (Egol-
fopoulos and Law158). Furthermore, measuring Markstein lengths has proved to be difficult.
Several techniques have been used to evaluate these lengths in various flows: spherical flames
(Bradley et al.54, Aung et al.18, Aung et al.19, Gu et al.196), oscillating flames (Searby and
Quinard473), stabilized V flames (Truffaut and Searby513), stagnation point flames (Law and
Sung295) among other configurations. The accuracy of these techniques is often a topic of
controversy and the source of many difficulties as illustrated below on three typical stretched
flame cases:
• stagnation point flames,
• flame tips,
• spherical flames.
Stagnation point flames
Stagnation point flames are commonly used to study laminar flames (Fig. 2.20a and b). For
theseflames,strainandstretchareequalsincethecurvatureterminEq.(2.89)iszero. Stretch
has a strong influence on flame fronts. Asymptotic theory (Libby and Williams309, Libby
and Williams305, Libby et al.308, Libby and Williams310), measurements (Ishizuka et al.236,
Law294) and numerical simulations (Darabiha et al.127, Giovangigli and Smooke186) provide a
fairlycompletedescriptionoftheresponseofstagnationpointflamestostretcheffects. Atlow
values of stretch, Markstein type behaviors are observed: flame speeds change linearly with
xiExtensionsofthisderivationaregivenbyClavinandGarcia104forvariabletransportpropertiesandNicoli
andClavin372 fornonadiabaticflames.

## 페이지 85
72 CHAPTER 2. LAMINAR PREMIXED FLAMES
stretch. For higher values of stretch, more sophisticated analytical theories, computations or
experiments are needed.
Independently of the method used to study stagnation point flames (experiment, theory
or computations), the interpretation of flame speeds in such flows must be considered with
caution. Stagnation point flames are steady and therefore the absolute flame speed is zero for
all isotherms:
s =0 and w~ =0 (2.111)
a
Eq.(2.99)showsthenthatthedisplacementspeedisoppositetotheflowspeedateverypoint:
s (Θ)=−~u.~n (2.112)
d
1.0
0.8
0.6
0.4
Reduced temperature Θ
0.2
Velocity
0.0
-1.0 -0.8 -0.6 -0.4 -0.2 0.0
Distance to stagnation plane
Figure 2.23: Velocity and temperature profiles in a stagnation point premixed flame.
Fig. 2.23 shows typical velocity and temperature profiles in a stagnation point premixed
flame (along the axis normal to the flame). Without flame in a potential stagnation point
flow, the velocity should vary linearly with x: u = −ax where a is the strain rate. In real
experimental data, the u profile is not always linear versus x even far from the flame front,
makingthedefinitionofstrainratedifficult. Moreimportantly,theflowspeedchangesrapidly
andreacheszeroonthestagnationplane. Itexhibitsalocalmaximumintheflamezonedueto
heatrelease. TheissueistochooseatwhichpointEq.(2.112)mustbeappliedtoevaluatethe
displacement speed s (0). Several techniques have been proposed in the literature (Deshaies
d
and Cambray137, Law and Sung295): using the minimum of the velocity in the reaction zone,
extrapolating the velocity profile to the reaction zone, etc. In general, these techniques lead
to ambiguous results even though they are the only possible method to use experimentally
(Vagelopoulos and Egolfopoulos516, Egolfopoulos and Law158). As argued by Williams554, it
is more meaningful to forget displacement speeds in such experiments if detailed information
is sought (Markstein lengths for example) and to focus on the consumption speed s which
c
is unambiguously defined by the integral of the reaction rate through the front (Eq. (2.95)).

## 페이지 86
2.7. FLAME SPEEDS 73
Unfortunately this quantity can only be computed (and not measured) but theoretical and
numerical results can be compared without ambiguity as discussed below (Table 2.12).
Consumption Absolute Displacement
speed s speed s (Θ) speed s (Θ)
c a d
Definition: − 1
R+∞ω˙
dn 0 −~u.~n
ρ1Y
F
1 −∞ F
Experiments: No Yes difficult
Computations: Yes Yes difficult
Table 2.12: Flamespeedexpressionsinaplanarstagnationpointflame. uisthelocalflowvelocity.
The“experiments”and“computations”linesindicatewhethercorrespondingspeedscanbeobtained
from measurements and/or from computations.
Stretching a flame first means feeding it with more fresh gases (because fuel mass fraction
gradients are increased), but also includes cooling the flame front more intensely (because
the temperature gradients are increased). Obviously, the Lewis number of the fuel Le =
F
λ/(ρC D) which measures the ratio between heat (λ/(ρC )) and species (D) diffusivities
p p
becomesacriticalparameterforstretcheffectsonflames. Asecondparametercontrollingthe
flame response is the level of heat losses (especially radiative losses).
Figure 2.24 summarizes typical asymptotic results for single stagnation point flames (con-
figurationdisplayedinFig.2.20)forLe =1. AspredictedfromEq.(2.110),theconsumption
F
speed of a flame with Le = 1 is almost insensitive to strain for low strain values. Actually,
F
it remains constant over a wide range of strain rates because both species and temperature
gradients increase in the same proportion. The only effect on reaction rate is that the flame
becomes thinner when strain increases.
Adiabatic flame
Consumption
speed sc
Non adiabatic
LeF = 1
Markstein zone flame
sc =sL o Stretch Κ
0 Critical stretch
Figure 2.24: Effectsofstretchonalaminarflamefront(Fig.2.20a)atLe =1: zeroLc Markstein
F a
length (Eq. (2.110)).
WhenLe <1(Fig.2.25),straineffectsareobservedforlowvaluesofstrain: thereaction
F
rate increases when strain increases as expected from the Markstein correlation (2.110) with
Mc <0. For higher strain values, the simple linear relationship (2.107) between consumption
a
speed s and stretch κ cannot be used anymore. The increase of flame speed due to strain
c

## 페이지 87
74 CHAPTER 2. LAMINAR PREMIXED FLAMES
canbequitesignificant: aleanhydrogen-airflamecandoubleitsspeedwhenstretched(Egol-
fopoulos and Law158). In the absence of heat loss, quenching is obtained only at very high
stretch values. When the flame is not adiabatic, sudden extinction can be observed for lower
strain rate levels.
Consumption
speed sc
Adiabatic flame
Non adiabatic
LeF < 1
Markstein zone flame
sc =sL o-La c Κ Stretch Κ
0 Critical stretch
Figure 2.25: Effects of stretch on a laminar flame front at Le <1: negative Lc Markstein length
F a
(Eq. (2.110)).
For Le > 1 (Fig. 2.26), the heat release decreases with increasing strain as soon as
F
the flame is strained (Mc > 0). Theory shows that very large values of Le could lead
a F
to quenching. However, usual values of Le are never large enough to induce quenching
F
(Williams554). What happens at very large strain values depends on heat losses. Asymptotic
studies reveal that heat losses control the existence of a turning point in the (s vs κ) curves
c
where the flame gets suddenly quenched. The critical value where quenching occurs scales
with s0/δ. These sudden extinction events are also observed in experiments and constitute
L
an excellent test of the prediction capacities of one-dimensional flame codes.
Consumption
speed sc
Adiabatic flame
Markstein zone
LeF > 1
sc =sL o-La c Κ
N
fla
o
m
n
e
adiabatic
Stretch Κ
0 Critical stretch
Figure 2.26: Effects of stretch on a laminar flame front at Le >1: positive Lc Markstein length
F a
(Eq. (2.110)).
Flame tips
In some cases, as in counterflow flames, s , s and s may differ by a large amount: the best
a d c
example (Fig. 2.27) is the steady laminar flame tip (Buckmaster and Crowley69, Poinsot et

## 페이지 88
2.7. FLAME SPEEDS 75
al.416). The absolute speed s of all flame elements is zero. The displacement speed s on
a d
the flame axis must therefore compensate exactly the flow speed. Since this velocity is fixed
arbitrarily and can be very large, the displacement speed must be also very large. In a flame
tip, s can easily be as large as 10 times the consumption speed s . In Fig. 2.27, the fresh
d c
gases flowing on the axis of the flame tip enter the flame front at a speed equal to the inlet
flow speed u.
Flame tip:
The flame moves at the flow speed u:
sa = 0, sd= u, sc=sL
.
Fresh gas
u=sd
Flame front
Figure 2.27: The flame tip: an illustration of displacement and consumption speeds.
Anumericalsimulationofatwo-dimensionalflametipatLe =1(Poinsotetal.416)shows
F
that the structure of the reaction zone is the same on the sides and at the tip of the flame
(Fig. 2.28): in particular, the consumption speed s on the sides as well as at the tip is equal
c
to s0. However, the displacement speed s =u on the flame axis is equal to 8s0 because the
L d L
inlet velocity was fixed to 8s0.xii This increase of the displacement speed on the axis is due
L
to two mechanisms:
• as shown by the streamlines in Fig. 2.28, a stream tube centered on the flame axis is
submitted to a strong expansion when passing through the flame: this induces a first
decrease of the flow speed at the tip.
• the tip itself is strongly curved and diffusive mechanisms also play a role: reactants
diffuse to the sides of the flame instead of entering the tip (see reactants pathlines on
Fig. 2.28). On the flame axis, the fuel mass fraction decreases far upstream of the tip.
As a consequence of these two effects (flow deceleration and fuel diffusion away from the
axis), the fuel flow rate entering the tip is decreased enough (by a factor 8 in this simulation)
to be consumed by the reaction zone (Poinsot et al.416).
Such results (Table 2.13) demonstrate that flame speeds can be very different especially
in curved flames. They also show that a flame can propagate against the flow at very large
velocities. This is important in the framework of turbulent flames.
xiiThis effect, obtained in a simulation at Lewis= 1 is independent of flame-tips opening and closing phe-
nomenawhichmayoccurfornon-unityLewisnumbers(LawandSung295).

## 페이지 89
76 CHAPTER 2. LAMINAR PREMIXED FLAMES
Figure 2.28: Isolevels of reaction rate, streamlines ( ) and pathlines of the fuel ( ) in a
half flame tip (Poinsot et al.416). (cid:13)cOPA (Overseas Publishers Association) N.V. with permission
from Gordon and Breach Publishers.
Consumption Absolute Displacement
speed s speed s (Θ) speed s (Θ)
c a d
Expression: − 1
R+∞ω˙
dn=s0 0 −~u.~n>>s0
ρ1Y
F
1 −∞ F l l
Experiments: No Yes Yes
Computations: Yes Yes Yes
Table2.13: Flamespeedexpressionsatthetipofbunsen-typeburneratLe =1(Poinsotetal.416).
F
The“experiments”and“computations”linesindicatewhethercorrespondingspeedscanbeobtained
from measurements and/or from computations.
Spherical flames
Another method to measure flame speeds and Markstein lengths is spherical deflagrations
(Dowdy et al.145, Aung et al.18, Gu et al.196). Igniting a flame in a stagnant premixed vessel
(Fig.2.29)producesasphericalflamewitharadiusr(t)whichcanbeuseddirectlytomeasure
both flame speed and stretch. In stagnation point flames or for a flame tip, the flow velocity
can be measured everywhere to compute flame speed and stretch. This is not possible for a
spherical unsteady flame and all flame information must be deduced only from the r(t) data.
Flame stretch is the easiest quantity to derive from r(t). The total flame area is A =
4πr(t)2:
1 dA 2 d
κ= = r(t) (2.113)
A dt rdt
Measuringflamespeedsismorecomplexbecauseboththeflowandtheflamemove. Some
assumptions are required to deduce flow and flame speeds from r(t). A first level of precision
correspondstoneglectingtheflamethicknessδ0. Underthisassumption,bothflameandflow
L
speedscanbederived. First, arelationshipbetweentheconsumptionspeeds andthesphere
c
radius r(t) is obtained by writing the conservation equation for the products mass fraction of
the reaction Y :
p

## 페이지 90
2.7. FLAME SPEEDS 77
∂ρY ∂
P + (ρ(u +V )Y )=ω˙ (2.114)
∂t ∂x i k,i P P
i
Fresh gas
1.0
(state 1)
0.8
Burnt gas
(state 2) r(t) R 0.6
R=0 0.4
δL 0 0.2
0.0
sdeeps
dezilamroN
Reduced temperature θ
Yp=Y p 2 Products mass fraction Y p
0 1 2 3 4
Normalized radius (R/r(t))
Figure 2.29: Spherical flame.
This equation can be integrated between r = 0 and r = ∞ in spherical coordinates to
yield:
d (cid:18)Z ∞ (cid:19) Z ∞
ρY dV = ω˙ dV (2.115)
dt P P
0 0
becausediffusiveandconvectivefluxesofproductsarezeroatr =0andr =∞. Thereaction
rate term on the RHS of Eq. (2.115) is directly linked to the consumption flame speed if the
flame is supposed to be thin and perfectly spherical:
Z ∞ Z ∞
ω˙ dV =4πr(t)2 ω˙ dr =4πr(t)2ρ s Y2 (2.116)
P P 1 c P
0 0
using Eq. (2.27) where Y2 is the products mass fraction in the fully burnt gases (Fig. 2.29).
P
On the other hand, the LHS term of Eq. (2.115) is time derivative of the total mass M of
burnt gas. If the flame has no thickness, M is simply:
Z ∞ 4π
ρY dV =ρ Y2 r(t)3 (2.117)
P 2 P 3
0
Writing that the time derivative of this mass is equal to the expression given by Eq. (2.116)
leads to a first expression of s as a function of r(t):
c
ρ d
s = 2 r(t) (2.118)
c ρ dt
1
Eq. (2.118) shows that the speed obtained from such measurements is the consumption
speed s . It depends on dr/dt but also on the density ratio between fresh and burnt gases:
c

## 페이지 91
78 CHAPTER 2. LAMINAR PREMIXED FLAMES
any level of radiative loss could change the burnt gas temperature and modify this ratio. The
displacementspeedcanbealsoobtainedfromthemeasurementofdr/dtbyusingazeroflame
thickness assumption to evaluate the flow speed u(r). Within the bubble of burnt gases, for
R<r(t), u(r) is zero. For R>r(t), u(r) can be evaluated by writing the continuity equation
between r = 0 and a given position R. The variation of the total mass within the sphere of
radius R is equal to the mass flux of fresh gases pushed outside the sphere:
(cid:18) (cid:19)
d 4 πρ r(t)3+ 4 πρ (cid:0) R3−r(t)3(cid:1) =−4πR2ρ u(R) (2.119)
dt 3 2 3 1 1
(cid:18)
r(t)
(cid:19)2(cid:18)
ρ
(cid:19)
d
or u(R)= 1− 2 r(t) (2.120)
R ρ dt
1
1.0
0.8
0.6
0.4
0.2
0.0
)td/rd(/u
seiticolev
dezilamroN
Displacement speed
Absolute speed
Flow speed
0 1 2 3 4 5 6
Normalized radius (R/r(t))
Figure 2.30: Flow and flame speeds in a spherical flame assuming zero flame thickness.
The flow velocity u(R) decreases with 1/R2 for large R values (Fig. 2.30). At the flame
front (R = r(t)), u(R) is discontinuous. Its maximum value is (1−ρ /ρ )d/dt(r(t)). If this
2 1
value is retained to evaluate the displacement speed s =s −u:
d a
ρ d
s = 2 r(t)=s (2.121)
d ρ dt c
1
An estimate of the displacement speed is also obtained: s is equal to the consumption speed
d
s .
c
The evaluations of flame speeds using a zero flame thickness assumption are summarized
in Table 2.14. Even though these expressions are sometimes used, they do not offer sufficient
precision especially if estimates of Markstein lengths (the derivatives of flame speeds versus
stretch) are sought. A more precise estimate for the flame speed must be derived without
assumptions on the flame thickness. Starting from Eq. (2.115), this can be done by providing

## 페이지 92
2.8. INSTABILITIES OF LAMINAR FLAME FRONTS 79
Consumption Absolute Displacement
speed s speed s (Θ) speed s (Θ)
c a d
Expression: ρ2 dr(t) dr(t) ≈ ρ2 dr(t)
ρ1dt dt ρ1dt
Experiments: Yes Yes Difficult
Computations: Yes Yes Difficult
Table 2.14: Flame speed expressions for spherical flames if the flame thickness is zero. The “ex-
periments” and “computations” lines indicate whether corresponding speeds can be obtained from
measurements and/or from computations.
betterestimatesforM: theburntmassM mustincludenotonlythefullyburntgases(between
r = 0 and r = r(t)) but also the burnt gases within the flame front itself (between r = r(t)
and r =r(t)+δ0). This second contribution is small but must be retained. It is also difficult
L
toevaluatebecauseitrequiresamodelforY (r)whichisnotknown. Itsmagnitude, however
P
can be evaluated by assuming mean values for all variables within the flame zone as follows:
Z ∞ 4π 1 1
ρY dV =ρ Y2 r(t)3+ (ρ +ρ )δ04πr(t)2 Y2 (2.122)
P 2 P 3 2 1 2 L 2 P
0
Writing that the time derivative of this mass (Fig. 2.29) is equal to the expression given by
Eq.(2.116)leadstoanexpressionofs asafunctionofr(t)whichincludestheeffectsoffinite
c
flame thickness:
(cid:20) 1 δ0 (cid:18) ρ (cid:19)(cid:21) ρ d
s = 1+ L 1+ 1 2 r(t) (2.123)
c 2r(t) ρ ρ dt
2 1
Forlargesphericalflames, r/δ islargeandtheusualzeroth-orderrelation(2.118)usedby
l
Aungetal.18isrecovered. Retainingthemoregeneralexpression(2.123)showswhyMarkstein
lengths measurements from spherical flames are difficult (Poinsot412): the small correction to
the flame speedonthe RHSofEq.(2.123) does notchange thevalueof s considerablybutit
c
changes the slope of s versus stretch considerably. Extracting Markstein lengths from such
c
datarequiresassumingagiventemperatureprofilewithintheflamefrontandusingthismodel
to post process data (Dowdy et al.145, Poinsot412).
2.8 Instabilities of laminar flame fronts
Throughout this chapter, laminar premixed fronts have been assumed to have a stable struc-
tureandtopropagatealongtheflamenormalwhileconservingaplanarone-dimensionalshape.
This is not always the case and various instability modes can appear along premixed flame
fronts (Joulin and Mitani247, Sivashinsky484, Williams554, Clavin103). For example, laminar

## 페이지 93
80 CHAPTER 2. LAMINAR PREMIXED FLAMES
Unstable regime (L e <1) Stable regime (L e >1)
Figure 2.31: Sketchofthermodiffusiveinstabilities. ForL <1,moleculardiffusion(emptyarrows)
e
is larger than heat diffusion (filled arrows) and the wrinkling of the flame front is enhanced by
differential flame speeds (left figure). For L >1 (right figure), a stable planar flame is obtained.
e
premixed flames exhibit intrinsic instabilities (called thermodiffusive) which are controlled by
the relative importance of reactant molecular and heat diffusion (i.e. on the Lewis number
L ) as illustrated in Fig. 2.31:
e
• If the molecular diffusion of reactants is higher than the thermal diffusivity (L < 1),
e
when the flame front is convex towards the fresh gases, reactants diffuse towards burnt
gases faster than heat diffuse towards cold fresh gases. These reactants are heated and
then burn faster, increasing the local flame speed s which is higher than the speed s0
L L
of a planar flame front. On the other hand, for fronts convex towards the burnt gases,
reactantsdiffuseinalargezoneandtheflamevelocityisdecreasedcomparedtos0. This
L
situation is unstable: the flame front wrinkling (as well as the flame surface) increases.
• When the species molecular diffusivity is lower than the heat diffusivity (Lewis number
larger than unity), a similar analysis shows that the flame is stable: the flame surface
decreases.
Thermodiffusiveinstabilitiesareobservedforexampleinleanlaminarhydrogen-airflames
where they lead to the formation of cellular flames. They are not the only instability mecha-
nism in laminar flames: a complete discussion of laminar flame front instabilities is out of the
scope of this book and interested readers are referred to Williams554 and Clavin103. In most
cases and especially in turbulent flames, these instabilities are often neglected (Chapters 4 to
6). However, recentresearchsuggeststhatthermodiffusivemechanismscouldbethesourceof
additional flame wrinkling in turbulent flames (§ 5.5.3).

## 페이지 94
Chapter 3
Laminar diffusion flames
3.1 Diffusion flame configurations
Diffusion flames constitute a specific class of combustion problems where fuel and oxidizer
are not mixed before they enter the combustion chamber: for these flames, mixing must
bring reactants into the reaction zone fast enough for combustion to proceed. In premixed
flames, mixing of fuel and oxidizer is performed before combustion and does not require
any attention: it becomes one of the main issues (if not the first) in diffusion flames. The
literature on diffusion flames is as abundant as on premixed flames (Linan and Crespo314,
Bilger37, Peters394, Bilger39) and this chapter concentrates on the basic notions required for
numerical studies of such flames.
Fig. 3.1 presents the prototype of the diffusion flame configuration. Instead of one state
(thepremixedreactants)forthepremixedflame,twoboundarystatesmustnowbeconsidered:
fuel (which may be diluted in other gases) on the left and oxidizer (diluted or not) on the
right side. Fuel and oxidizer diffuse towards the reaction zone where they burn and generate
heat. Temperature is maximum in this zone and diffuses away from the flame front towards
the fuel and oxidizer streams.
Fig. 3.1 illustrates a number of important considerations:
• Far away on each side of the flame, the gas is either too rich or too lean to burn.
Chemical reactions can proceed only in a limited region, where fuel and oxidizer are
mixed adequately. The most favorable mixing is obtained where fuel and oxidizer are in
stoichiometric proportions: a diffusion flame usually lies along the points where mixing
produces a stoichiometric mixture.
• The flame structure plotted on Fig. 3.1 is steady only when strain is applied to the
flame, i.e. whenfuelandoxidizerstreamsare pushedagainsteachotheratgivenspeeds
(Fig. 3.2b). In a pure one-dimensional unstrained case, the flame spreads with time t
(Fig.3.2a),getschokedinitscombustionproductsandthereactionrateslowlydecreases
√
as 1/ t, as described in Section 3.4.1.
81

## 페이지 95
82 CHAPTER 3. LAMINAR DIFFUSION FLAMES
Temperature
Fuel mass fraction YF YO=YO0
YF=YF0
Oxidizer mass fraction YO
T=TO0
T=TF0
Heat release
Abscissa
Diffusion zone Reaction zone Diffusion zone
Figure 3.1: Diffusion flame structure.
• A diffusion flame does not exhibit a reference “speed” as premixed flames (§ 2.7.1): the
flame is unable to propagate towards fuel because of the lack of oxidizer and it cannot
propagate towards oxidizer stream because of the lack of fuel. Accordingly, the reaction
zone does not move significantly relatively to the flow field. Being unable to propagate
“against” the flow, diffusion flames are more sensitive to velocity perturbations, and
especially to turbulence, than premixed flames.
• Adiffusionflamedoesnothaveareference“thickness”: theunstretchedflameofFig.3.2a
grows up indefinitely with time while the thickness of stretched flames of Fig. 3.2b
depends essentially on stretch and can take a very wide range of values. Again, this is
very different from premixed flames where a thickness may be introduced and depends
on the fluid properties and the flame speed (§ 2.5).
• In terms of industrial applications, mixing is also the key characteristic of diffusion
flames. These flames are simpler to design and to build: no premixing, with a given
equivalenceratio, isrequired. Theyarealsosafertooperatebecausetheydonotpropa-
gate. However,theirburningefficiencyisreducedcomparedtopremixedflamesbecause
mixing reduces the speed at which chemical reactions may proceed.
Many fundamental concepts related to diffusion flames are necessary to understand how
such flows are solved for in combustion codes. Section 3.2 presents these notions (mixture
fraction, flame structure, mixing problem) and shows how solving for a diffusion flame is
usually decoupled into two problems: the first is related to the mixing processes between
fuel and oxidizer; the second addresses the combustion process (the flame structure) once
mixing is achieved. Section 3.3 presents a few classical results on flame structure in the
simplest case where chemistry is infinitely fast while Section 3.4 presents complete solutions,
includingresolutionofthemixingproblem,forthesamesituation. Extensionstomorerealistic
chemistry models and to real flames are discussed in Section 3.5 and 3.6.

## 페이지 96
3.2. THEORETICAL TOOLS FOR DIFFUSION FLAMES 83
Fuel mass fraction Temperature at t= t1
YF at t= t1
Temperature at t= t2 > t1
Fuel mass fraction
YF at t= t2 > t1
Abscissax
(a) the unsteady unstretched diffusion flame
Fuel mass fraction
x2
on the axis Temperature on the axis
Fuel jet Oxidizer jet
axis x1
(b) the steady stretched diffusion flame
Figure 3.2: Unsteady unstretched and steady stretched diffusion flames.
3.2 Theoretical tools for diffusion flames
Many studies of diffusion flames assume idealized situations using the passive scalar (or mix-
ture fraction) notion that is the starting point of the analysis. To describe this concept,
assumptions are introduced to allow simple derivations. Very few of these assumptions are
satisfied in a real flame and Section 3.6 shows that real flames differ from the ideal situation
studiedinthissection. Qualitatively, however, thepresentresultsarethecommonbasisofall
diffusion flame studies.
Considering a single-step chemical reaction (M =1) with N species:
N N
X X
ν0M *) ν00M (3.1)
k k k k
k=1 k=1
the assumptions made to analyze idealized diffusion flames are the following:
• H1 - thermodynamic pressure is constant and Mach numbers are small.
• H2 - all the diffusion coefficients D of chemical species are equal to D. Fick’s law,
k
without velocity correction, is used for diffusion velocities.

## 페이지 97
84 CHAPTER 3. LAMINAR DIFFUSION FLAMES
• H3 - the heat capacities C of chemical species are equal and independent of tempera-
pk
ture: C =C .
pk p
3.2.1 Passive scalars and mixture fraction
Consider first the case where reaction (3.1) involves only fuel (F), oxidizer (O) and products
(P):
ν F +ν O *)ν P (3.2)
F O P
The mass fraction Y of each species (F, O, and P) follows a balance equation given by:
k
(cid:18) (cid:19)
∂ρY ∂ ∂ ∂Y
k + (ρu Y )= ρD k +ω˙ (3.3)
∂t ∂x i k ∂x ∂x k
i i i
Species reaction rates ω˙ are all related to the single-step reaction rate Q (Eq. 1.22):
k
ω˙ =W ν Q (3.4)
k k k
so the oxidizer reaction rate is linked to the fuel reaction rate:
ν W
ω˙ =sω˙ with s= O O (3.5)
O F ν W
F F
where s is the mass stoichiometric ratio defined in Eq. (1.28). The reaction rate for tempera-
ture is also obviously linked to the fuel reaction rate through Eq. (2.17):
ω˙ =−Qω˙ (3.6)
T F
Using these relations, the conservation equations for fuel, oxidizer and temperature become:
(cid:18) (cid:19)
∂ρY ∂ ∂ ∂Y
F + (ρu Y ) = ρD F +ω˙ (3.7)
∂t ∂x i F ∂x ∂x F
i i i
(cid:18) (cid:19)
∂ρY ∂ ∂ ∂Y
O + (ρu Y ) = ρD O +sω˙ (3.8)
∂t ∂x i O ∂x ∂x F
i i i
(cid:18) (cid:19)
∂ρT ∂ ∂ λ ∂T Q
+ (ρu T) = − ω˙ (3.9)
∂t ∂x i ∂x C ∂x C F
i i p i p
CombiningEq.(3.7)to(3.9)twobytwo,assumingunityLewisnumbers(Le=λ/ρC D =
p
1) shows that the three quantities:
C T C T
Z =sY −Y ; Z = p +Y ; Z =s p +Y (3.10)
1 F O 2 Q F 3 Q O
follow the same balance equation, without source terms:
(cid:18) (cid:19)
∂ρZ ∂ ∂ ∂Z
+ (ρu Z)= ρD (3.11)
∂t ∂x i ∂x ∂x
i i i

## 페이지 98
3.2. THEORETICAL TOOLS FOR DIFFUSION FLAMES 85
Z is a passive (or conserved) scalar and changes because of diffusion and convection but not
reaction.i The variable Z is directly linked to the quantity Y +Θ introduced in premixed
2
flames (§ 2.4.3): Z =(Y +Θ)Y1+C T /Q. In perfectly premixed flames, Y +Θ is constant
2 F p 1
and equal to unity everywhere (see Eq. 2.35). For diffusion flames Z is not constant because
2
fuel and oxidizer are not mixed before combustion. However, Z is a passive scalar indicating
2
that mixing can still be studied independently from combustion.
The three variables Z , Z and Z , defined in Eq. (3.10) follow the same balance equation
1 2 3
but have different boundary conditions summarized in Table 3.1 (notations are defined on
Fig. 3.1).
Passive scalar Z Fuel value ZF Oxidizer value ZO
i i
Z sY0 −Y0
1 F O
Z CpT F 0 +Y0 CpT O 0
2 Q F Q
Z sCpT F 0 sCpT O 0 +Y0
3 Q Q O
Table 3.1: Boundary conditions for the passive scalars defined in Eq. (3.10). Y0 and Y0 are fuel
F O
andoxidizermassfractionsinpurefuelandoxidizerstreamsrespectively(reactantsmaybediluted).
T0 and T0 denote the corresponding temperatures.
F O
Normalized z variables are defined by:
j
Z −ZO
z = j j for j =1,2,3 (3.12)
j ZF −ZO
j j
All reduced variables z follow the same convection/diffusion balance equation:
j
(cid:18) (cid:19)
∂ρz ∂ ∂ ∂z
j + (ρu z )= ρD j (3.13)
∂t ∂x i j ∂x ∂x
i i i
and have the same boundary conditions: z =1 in the fuel stream and z =0 in the oxidizer
j j
stream (Table 3.2). All these variables are therefore equal:ii
z =z =z =z (3.14)
1 2 3
where z is called the mixture fraction and measures the local fuel/oxidizer ratio. Expressing
z using the boundary conditions given in Table 3.1 leads to:
z = sY F −Y O +Y O 0 = C Q p(T −T O 0)+Y F = s Q Cp(T −T O 0)+Y O −Y O 0 (3.15)
sY0+Y0 Cp(T0 −T0)+Y0 sCp(T0 −T0)−Y0
F O Q F O F Q F O O
iReactionstillplaysanindirectroleinZcontrollingtemperatureand,therefore,densityandvelocityfields.
iiThis property holds at any time if it is verified at the initial time. If not (for example, when a diffusion
flameisignitedbyahotspotatt=0),z1=z2=z3 afterafewtypicaldiffusiontimes.

## 페이지 99
86 CHAPTER 3. LAMINAR DIFFUSION FLAMES
The first part of Eq. (3.15) may be recast as:
(cid:18) (cid:19)
1 Y Y
z = φ F − O +1 (3.16)
φ+1 Y0 Y0
F O
where the equivalence ratio φ is introduced:
Y0
φ=s F (3.17)
Y0
O
Thisequivalenceratioisanimportantchemicalparameterindiffusionflamesandcorresponds
to the equivalence ratio obtainedwhen premixingthe same mass offuel and oxidizer streams.
It does not correspond to the overall (or global) equivalence ratio inside a burner, depending
both on φ and on fuel and oxidizer flow rates (see § 3.3.4).
The previous derivations are valid in multi-dimensional flows and for any combustion
regime: they could also be used in premixed flames. But, in perfectly premixed flows, this
concept is not useful as z is constant everywhere.
Variable Fuel value Oxidizer value
Fuel mass fraction Y0 0
F
Oxidizer mass fraction 0 Y0
O
Temperature T0 T0
F O
Mixture fraction z 1 0
Table 3.2: Boundary conditions for species mass fractions, temperature and the mixture fraction z
defined by Eq. (3.12).
3.2.2 Flame structure in the z-space
Theintroductionofthemixturefractionz allowstoreducethenumberofvariables. Eq.(3.15)
showsthatallspecies, forexample, arefunctionofthemixturefractionz andtemperatureT:
Y =f (z,T) for k =1,N (3.18)
k k
Even though this is a useful simplification of the initial problem, one more step needs to be
taken using the following assumption:
• H4 - the structure of the diffusion flame depends on the mixture fraction z and on time
t only. Temperature and species mass fractions can be written:
T =T(z,t) and Y =Y (z,t) (3.19)
k k

## 페이지 100
3.2. THEORETICAL TOOLS FOR DIFFUSION FLAMES 87
z gradient
x2
Iso z surface
x1 y3
Tangent plane to y2
iso z surface
x3
Figure 3.3: Variable change for diffusion flame sheets (Williams554, Peters398).
The functions T(z,t), Y (z,t) of Eq. (3.19) define the flame structure. The assumption
k
H4 can be introduced and justified in multiple ways. Formally, it is a variable change in the
speciesequations(3.3)from(x ,x ,x ,t)to(z,y ,y ,t)wherey andy arespatialvariables
1 2 3 2 3 2 3
in planes parallel to iso-z surfaces (Fig. 3.3). In the resulting equation, terms corresponding
to gradients along the flame front (gradients along y and y ) are neglected in comparison
2 3
to the terms normal to the flame (gradients along z) (see Williams554, Peters398 for details
andalternativederivations). Physically,allthesederivationsimplythattheflamestructureis
locally one-dimensional and depends only on time and on the coordinate normal to the flame
front (or on z). In a multi-dimensional flow, this assumption requires that the flame be thin
compared to other flow and wrinkling scales. Each element of the flame front can then be
viewed as a small laminar flame also called flamelet: this flamelet view is the basis of many
models for turbulent combustion (Chapt. 4 to 6). Under this hypothesis, the species mass
fraction balance equations (3.3) may be rewritten:
(cid:20) (cid:21) (cid:20) (cid:18) (cid:19)(cid:21)
∂Y ∂ρ ∂ ∂Y ∂z ∂z ∂ ∂z
ρ k +Y + (ρu ) + k ρ +ρu − ρD
∂t k ∂t ∂x i ∂z ∂t i∂x ∂x ∂x
i i i i
(cid:18) ∂z ∂z (cid:19) ∂2Y
− ρD k =ω˙ (3.20)
∂x ∂x ∂z2 k
i i
The two terms within brackets in the LHS of Eq. (3.20) vanish because of continuity and
mixture fraction (Eq. 3.13) balance equations:
∂Y (cid:18) ∂z ∂z (cid:19) ∂2Y 1 ∂2Y
ρ k =ω˙ +ρD k =ω˙ + ρχ k (3.21)
∂t k ∂x ∂x ∂z2 k 2 ∂z2
i i

## 페이지 101
88 CHAPTER 3. LAMINAR DIFFUSION FLAMES
where the scalar dissipation rate χ has been introduced:iii
(cid:18) (cid:19)
∂z ∂z
χ=2D (3.22)
∂x ∂x
i i
The temperature equation can also be recast in the same way:
∂T 1 ∂2T
ρ =ω˙ + ρχ (3.23)
∂t T 2 ∂z2
Eq. (3.21) and (3.23) are called the flamelet equations.iv They are key elements in many
diffusion flame theories: in these equations, the only term depending on spatial variables (x )
i
is the scalar dissipation rate χ which controls mixing (because it controls the gradients of z).
Once χ is specified, the flamelet equations can be entirely solved in z space to provide the
flame structure, i.e. the temperatures and species as functions of mixture fraction z and time
t, as supposed in Assumption H4:
T =T(z,t) and Y =Y (z,t) (3.24)
k k
Although this is not explicit in the present notation, the T and Y functions are parame-
k
trizedbythescalardissipationrateχ: differentscalardissipationlevelsleadtodifferentflame
structures.
Thescalardissipationrateχhasthedimensionofaninversetime(likestrain). Itmeasures
the z-gradients and the molecular fluxes of species towards the flame. It is directly influenced
by strain: when the flame strain rate increases, χ increases (§ 3.4.2). An estimate of the
p
mixing layer thickness is D/χ.
3.2.3 The steady flamelet assumption
The flamelet structure obtained from Eq. (3.21) and (3.23) depends both on time t and on
mixture fraction z. It can be used in two ways:
• Unsteady laminar flamelets. The dependence of the T and Y functions versus time can
k
be conserved, leading to a class of approach called “unsteady flamelets”.
• Steady laminar flamelets. The structure of the flamelet can be assumed to be steady,
even though the flow itself (and especially the z field) depends on time. In this case:
T =T(z) and Y =Y (z) (3.25)
k k
iiiVarious definitions of the scalar dissipation rate may be found in the literature, including, or not, the
densityρandthefactor2.
ivExtended flamelet equations including effects of non-unity Lewis number, variable molecular weights or
radiativeheatlossescanalsobederived: seePitschandPeters408,PitschandPeters407 orPeters398.

## 페이지 102
3.2. THEORETICAL TOOLS FOR DIFFUSION FLAMES 89
To simplify the presentation, this steady flamelet approximation will be used in the
following, except when mentioned explicitly. Note that the T and Y functions are still
k
parametrized by the scalar dissipation rate level.
Using Eq. (3.25), Eq. (3.21) and (3.23) reduce to:
1 ∂2Y 1 ∂2T
ω˙ =− ρχ k and ω˙ =− ρχ (3.26)
k 2 ∂z2 T 2 ∂z2
|{z} |{z} |{z} |{z}
mixing reaction mixing reaction
Eq. (3.26) shows that reaction rates for species or temperature depend on z and χ only.
Flowinformationisentirelycontainedinthescalardissipationrateχwhereaschemicaleffects
are incorporated through the flame structure in z-space. This important simplification is
emphasized in the following section.
3.2.4 Decomposition into mixing and flame structure problems
Mixture fraction appears as the basic variable for most theories of laminar flames and essen-
tiallydecouplesdiffusionflamecomputations(findingT(x ,t)andY (x ,t))intotwoproblems:
i k i
• A mixing problem (problem 1) where Eq. (3.13) must be solved to obtain the mixture
fraction field z(x ,t) as a function of spatial coordinates x and time t.
i i
• A flame structure problem (problem 2) where the links between flame variables (mass
fractions Y (z), solutions of Eq. (3.21) and temperature T(z), solution of Eq. (3.23))
k
and z are used to construct all flame variables.
Both problems must be solved to determine the flame variables: knowing z only would
providetheentirefieldofvariablecombinationssuchasZ =sY −Y , Z =C T/Q+Y or
1 F O 2 p F
Z =sC T/Q+Y but not the variables T, Y or Y themselves. To obtain these variables,
3 p O F O
additional assumptions on the flame structure must be used to link flame variables to the
mixture fraction and obtain T(z), Y (z) or Y (z). Section 3.2.5 discusses these assumptions.
F O
Figure 3.4 summarizes how the problem of computing diffusion flame is usually split into
two sub-problems: flame structure and mixing. A steady flamelet approximation is used as
discussed in Section 3.2.3 but the same concept applies for unsteady flamelets. All aspects
related to the flow (geometry, boundary conditions) must be treated in the mixing problem.
On the other hand, all chemistry information is gathered in the flame structure part.
3.2.5 Models for diffusion flame structures
The introduction of mixture fraction allows analytical solutions for diffusion flames using
additional assumptions discussed here:

## 페이지 103
90 CHAPTER 3. LAMINAR DIFFUSION FLAMES
Boundary conditions Assumptions on reversibility
Initial conditions and chemistry speed
Geometry
Flow field
1: Mixing problem 2: Flame structure problem
Scalar
determine the field of the dissipation specify:
mixture fraction rate field - species Yk for k = 1 to N
- temperature T
as functions of the mixture fraction z
z(xi,t) T(z) Yk(z)
Solution of the full problem: T(xi,t), Yk(xi,t)
Figure 3.4: Decomposition into two problems: flame structure (right) and mixing (left). The T(z)
and Y (z) functions may depend on additional parameters (like time or scalar dissipation rate).
k
• Equilibrium (or fast chemistry): assuming that chemistry is infinitely fast, i.e. that
chemical time scales are shorter than all other flow characteristic times (chemical reac-
tion is faster than diffusion and flow time scales) is called the “equilibrium” (or “fast
chemistry”) assumption. It allows simplification of the problem enough to provide, in
somecases,analyticalsolutionsforflamestructures(§3.3). Thisassumptionimpliesthat
chemical reactions proceed locally so fast that equilibrium is instantaneously reached.
• Irreversibility: assuming that reaction (3.2) proceeds only from left to right (the reverse
constant of Eq. (3.2) is zero) allows additional simplifications.
Combining assumptions of infinitely fast chemistry (equilibrium) and irreversibility leads
to Table 3.3.
1. For infinitely fast and irreversible chemistry, fuel and oxidizer cannot exist at the same
time. This important simplification is analyzed in Section 3.3. This simplest “equi-
librium” assumption is called “irreversible fast chemistry”. Here, the T(z) and Y (z)
k
functions of Fig. 3.4 do not depend on the scalar dissipation rate.
2. Underinfinitelyfast,butreversiblechemistry,fuel,oxidizerandproductsmassfractions
are linked by the equilibrium relation:
YνFYνO
F O =K(T) (3.27)
YνP
P
where K(T) is the reaction equilibrium constant at temperature T. This relation links
local mass fractions and temperature. In this situation, fuel and oxidizer may be found

## 페이지 104
3.2. THEORETICAL TOOLS FOR DIFFUSION FLAMES 91
simultaneously at the same location at the same time. The T(z) and Y (z) functions of
k
Fig. 3.4 do not depend on the scalar dissipation rate.
3. For an irreversible but not infinitely fast chemical reaction, fuel and oxidizer may also
existsimultaneously. Theoverlapbetweenfuelandoxidizerprofilesdependsnowonflow
time scales and especially on the scalar dissipation rate: the T(z) and Y (z) functions
k
of Fig. 3.4 must be parametrized by the scalar dissipation rate.
4. In the general case (finite rate chemistry and reversible reaction), no specific guess can
be made on the flame structure and the T(z) and Y (z) functions depend on the scalar
k
dissipation rate.
5. AspecificcaseofinterestismentionedinthelastlineofTable3.3: chemistrycanalsobe
“frozen”: no reaction takes place and pure mixing between fuel and oxidizer proceeds.
The T(z) and Y (z) functions do not depend on the scalar dissipation rate.
k
Fast chemistry Finite rate chemistry
(equilibrium): ω˙ =0 (non equilibrium) ω˙ 6=0
k k
Irreversible F and O cannot coexist F and O may overlap
chemistry (independently of χ) in reaction zone (depending on χ)
Section 3.3 Section 3.5.2
Reversible F, O and P are in No simple
chemistry equilibrium (χ=0) model for this
Section 3.5.1 case
Frozen F and O mix Not
(pure mixing) but do not burn applicable
Table 3.3: Equilibrium (fast chemistry) and reversibility assumptions.
EachentryinTable3.3correspondstodifferentmodelsdescribedinthefollowingsections.
ThefirstcolumnofTable3.3deservessomeattention. Forall“equilibrium”cases,thereaction
rate ω˙ is zero. According to Eq. (3.26), this can be obtained in different ways:
k
 ∂2Y

∂z2
k = 0
ω˙ =0 =⇒ (3.28)
k or

χ = 0
The first condition, ∂2Y /∂z2 =0, is fulfilled when species mass fractions depend linearly on
k
z: Y =α z+β , where α and β are constants. As a consequence, Eq. (3.28) is satisfied in
k k k k k
three cases:

## 페이지 105
92 CHAPTER 3. LAMINAR DIFFUSION FLAMES
• Irreversible infinitely fast chemistry. The first solution is to have ∂2Y /∂z2 = 0
k
and corresponds to a infinitely thin flame separating fresh and burnt gases. On both
sides of the flame, temperature and species profiles are linear versus z (§ 3.3) but their
slopes are discontinuous at the flame front. The reaction rate is zero everywhere except
at the flame front where it is infinite.
• Reversible fast chemistry. The reaction rate is also zero in Eq. (3.28) if χ = 0:
all molecular fluxes are negligible compared to reaction rates. Chemical reactions take
place without mixing and reach a local equilibrium defined by Eq. (3.27).
• Frozen chemistry (pure mixing). If combustion does not proceed at all (“frozen”
chemistry), pure mixing takes place. The solution to such a mixing problem satisfies
∂2Y /∂z2 =0. The “pure mixing” solution is:
k
Y =Y0z and Y =Y0(1−z) (3.29)
F F O O
The temperature on the mixing line is a mass average (weighted by z) of the fuel and
oxidizer temperatures:
T(z)=zT0 +(1−z)T0 (3.30)
F O
TO 0
Temperature
TF 0
0 1 z
Oxidizer mass Fuel mass YF 0
fraction fraction
YO 0
0 1 z
Figure 3.5: Pure mixing with frozen chemistry between fuel and oxidizer.
This solution corresponds to pure mixing, without chemical reaction, between fuel (F)
and oxidizer (O) streams. Fig. 3.5 presents the structure in the z-diagram for such
a flow: temperature and mass fractions at any point in the flow are plotted versus

## 페이지 106
3.3. FLAME STRUCTURE FOR IRREVERSIBLE INFINITELY FAST CHEMISTRY 93
mixture fraction z at the same point. This structure is one of the (trivial) solutions to
the diffusion flame problem.
The next section presents results for reacting situations, first for equilibrium and finally
for non-equilibrium cases.
3.3 Flame structure for irreversible infinitely fast chem-
istry
The first approach to solve Problem 2 (the flame structure) mentioned in Section 3.2.4 with
combustion is to assume infinitely fast chemistry (first line in Table 3.3): fuel and oxidizer
cannot be found together at the same location because their combustion rate is infinitely fast
compared to all other time scales in the flame. This is the derivation used initially by Burke
and Schumann73.
3.3.1 The Burke-Schumann flame structure
In this case, flame variables and mixture fraction are simply related by setting either Y =0
O
(on the fuel side) or Y =0 (on the oxidizer side) in Eq. (3.16):
F
• On the fuel side (z >z )
st
Y0 z−z
Y (z) = zY0+(z−1) O =Y0 st
F F s F1−z
st
Y (z) = 0. (3.31)
O
QY0 1−z
T(z) = zT0 +(1−z)T0 + Fz
F O C st1−z
p st
• On the oxidizer side (z <z ):
st
Y (z) = 0.
F
z
Y (z) = Y0(1− )
O O z (3.32)
st
QY0
T(z) = zT0 +(1−z)T0 + Fz
F O C
p
where the flame position in the z-space, z , is determined by expressing that the flame is
st
locatedwherebothY andY arezero. Atthislocation, z isequaltoitsstoichiometricvalue
F O
z given by Eq. (3.15) :
st
1 1 1
z = = = (3.33)
st sY0 ν W Y0 1+φ
1+ F 1+ O O F
Y0 ν W Y0
O F F O

## 페이지 107
94 CHAPTER 3. LAMINAR DIFFUSION FLAMES
where φ=sY0/Y0 is the equivalence ratio.v
F O
Typical values of φ and z are listed in Table 3.4 for usual fuels. The value of z has
st st
a direct physical consequence: for low z , the flame lies close to the oxidizer side while it is
st
located close to the fuel side for large values of z . For hydrocarbon jet flames (pure fuel
st
injected into air), z is small (of the order of 0.05): the flame front is located close to the air
st
stream.
Fuel / oxidizer Y0 Y0 ν ν s φ z
F O F O st
Pure H / Pure O 1 1 1 0.5 8 8.00 0.111
2 2
Pure H / Air 1 0.23 1 0.5 8 34.8 0.028
2
Pure CH / Pure O 1 1 1 2 4 4.00 0.200
4 2
Pure CH / Air 1 0.23 1 2 4 17.4 0.054
4
Diluted CH / Pure O 0.05 1 1 2 4 0.20 0.833
4 2
Diluted CH / Air 0.05 0.23 1 2 4 0.87 0.535
4
Pure C H / Pure O 1 1 1 5 3.64 3.64 0.216
3 8 2
Pure C H / Air 1 0.23 1 5 3.64 15.8 0.059
3 8
Table 3.4: Examplesofvaluesofmassstoichiometricratios(Eq.3.5),equivalenceratioφ(Eq.3.17)
and stoichiometric mixture fraction z (Eq. 3.33). Diluted methane is arbitrary defined here as a
st
mixture of methane (mass 5 %) and nitrogen (95 %).
The flame structure for infinitely fast irreversible chemistry (i.e. the so called Burke
and Schumann73 solution) is displayed in Fig. 3.6. On this figure, the “mixing” lines are
also displayed. These lines correspond to states where fuel and oxidizer would mix without
reaction (Eq. 3.29). These mixing lines are important in ignition or quenching problems and
moregenerallyforallflameswhichdonotburnvigorously. Theydetermineoneextremestate
of the flow where mixing takes place without reaction: for such cases, the diffusion flame is
only a diffusive layer in which fuel and oxidizer mix like in a non-reacting flow. In a given
laminar or turbulent diffusion flame, measuring and plotting T, Y and Y in a z diagram
F O
gives a useful picture of the flame. All points must be located between the mixing and the
equilibriumlines(nootherstateispossible). Whenmostpointsarelocatedclosetothemixing
line,theflameisalmostextinguishedornotignitedyet. Ontheotherhand,z diagramswhere
points are located close to the combustion line indicate vigorous flames. How close these
points can be to the ideal combustion lines is determined by chemistry as discussed in the
following sections.
vNotethatthissolutionverifiesEq.(3.28)analyzedinSection3.2.5butdoesnotrequiretheassumptions
(i.e. one-dimensionalsteadydiffusionflame)introducedtoderiveEq.(3.26).

## 페이지 108
3.3. FLAME STRUCTURE FOR IRREVERSIBLE INFINITELY FAST CHEMISTRY 95
Tad
Equilibrium lines
Temperature
: possible states
TO 0
TF 0
Mixing line
0 zst 1 z
Equilibrium lines YF 0
Fuel mass Mixing line
fraction
0 zst 1 z
Mixing line
YO 0
Equilibrium lines
Oxidizer mass
fraction
0 zst 1 z
Figure 3.6: Diffusionflamestructureinthemixturefractionz diagramforirreversibleinfinitelyfast
chemistry (Burke and Schumann73 solution) and pure mixing without chemical reaction.
3.3.2 Maximum local flame temperature in a diffusion flame
Without heat losses, the maximum flame temperature (i.e. the adiabatic flame temperature
for a diffusion flame) is reached for z =z (Eq. 3.31 or Eq. 3.32):vi
st
QY0 1 (cid:18) QY0(cid:19)
T =z T0 +(1−z )T0 + Fz = T0 +T0φ+ F (3.34)
ad st F st O C st 1+φ F O C
p p
Eq. (3.34) may be recovered following a more intuitive approach directly linked to the
equilibriumassumption: supposethatz massunitsoffuelareextractedfromthefuelstream
st
and mixed with (1−z ) mass units of oxidizer extracted from the oxidizer stream (Fig. 3.7).
st
The temperature of this fresh mixture is z T0 +(1−z )T0. According to Eq. (3.29), the
st F st O
fuel mass fraction in the mixture is Y0z . Burning this mixture to equilibrium at constant
F st
viThis expression only holds for a single irreversible reaction, equal Lewis numbers and a constant heat
capacityCp.

## 페이지 109
96 CHAPTER 3. LAMINAR DIFFUSION FLAMES
pressure increases its temperature by QY0z /C . The final temperature is z T0 + (1 −
F st p st F
z )T0 +QY0z /C recovering Eq. (3.34). The same approach may be used to reconstruct
st O F st p
the complete temperature field T(z). It can also be extended to multiple reactions as long
as they all reach equilibrium. Note, however, that this formalism only holds when all Lewis
numbers are unity and a unique mixture fraction z may be defined.
Fresh mixture
Pure mixing Pure mixing
FUEL
T=zTF 0+(1-z)TO 0
OXIDIZER
z YF= YF 0 z 1-z
YO= YO 0(1- z)
Combustion
Burnt products
T=zTF 0+(1-z)TO 0 + Q YF 0z /Cp if z<zst
T=zTF 0+(1-z)TO 0 + Q YF 0zst /Cp (1-z)/(1-zst) if z>zst
Figure 3.7: Equilibrium assumption to determine the temperature of a diffusion flame for unity
Lewis number as a function of mixture fraction z.
3.3.3 Maximum flame temperature in diffusion and premixed flames
It is interesting to compare the maximum temperature reached in a diffusion flame with the
adiabaticflametemperatureobtainedinapremixedflamegivenbyEq.(2.28). Ifthefueland
the oxidizer have equal initial temperatures (T0 = T0 = T ), the maximum temperature for
F O 0
the diffusion flame is given by Eq. (3.34):
QY0
Tdiff =T + Fz (3.35)
ad 0 C st
p
Considernowthefuelstreamandmixitinstoichiometricproportionswithoxidizer. Eq.(3.29)
shows that the fuel mass fraction in this mixture will be Y0z . Using Eq. (2.28) shows that
F st
the temperature of this stoichiometric premixed flame is:
QY0z
Tprem =T + F st (3.36)
ad 0 C
p
whichisexactlythetemperatureobtainedforthediffusionflameinEq.(3.35): themaximum
temperature reached in a diffusion flame is the temperature of the stoichiometric premixed
flame which can be formed by mixing the fuel stream with oxidizer.
3.3.4 Maximum and mean temperatures in diffusion burners
Consider a burner fed by fuel (stream 1, mass flow rate m˙ , mass fraction Y0) and oxidizer
1 F
(stream2,massflowratem˙ ,massfractionY0)asdisplayedonFig3.8. Theglobalequivalence
2 O

## 페이지 110
3.3. FLAME STRUCTURE FOR IRREVERSIBLE INFINITELY FAST CHEMISTRY 97
ratio φ (i.e. the equivalence ratio obtained if all fuel and oxidizer flow rates would mix
g
perfectly) is (see Eq. 1.33 and 1.34):
m˙
φ =φ 1 (3.37)
g m˙
2
Inside the burner, the flame is located at the stoichiometric zone z = z and its maximum
st
temperature is given by Eq. (3.34):
QY0z T0 +φT0 QY0
T =z T0 +(1−z )T0 + F st = F O + F (3.38)
ad st F st O C 1+φ C (1+φ)
p p
ThismaximumtemperatureT reachedinsidetheburnerdoesnotdependonmassflowrates
ad
or on the global equivalence ratio φ . T is only a function of free stream temperatures, T0
g ad F
and T0, equivalence ratio φ and inlet fuel mass fraction Y0.
O F
Stream 1:
Temperature TF 0
Diffusion flame. Maximum
Fuel mass fraction YF 0 temperature Tad
Outlet plane.
Stream 2: Mean temperature Tm
Temperature TO 0
Oxidizer mass fractionYO 0
Figure 3.8: Maximum and mean outlet temperatures in a diffusion burner.
The mean temperature T reached at the outlet of the combustion chamber after com-
m
plete combustion corresponds to the temperature obtained once a fuel mass flow rate m˙ has
1
completely mixed and burnt with an oxidizer flow rate m˙ . The mixture temperature before
2
combustion is:
m˙ m˙ T0 T0
T0 = 1 T0 + 2 T0 = F + O (3.39)
m m˙ +m˙ F m˙ +m˙ O 1+φ/φ 1+φ /φ
1 2 1 2 g g
Fuel and oxidizer mass fractions in such a mixture are given by:
m˙ Y0 Y0 m˙ Y0 Y0
Y = 1 F = F and Y = 2 O = O (3.40)
F m˙ +m˙ 1+φ/φ O m˙ +m˙ 1+φ /φ
1 2 g 1 2 g
The equivalence ratio of this virtual premixing is sY /Y =φ .
F O g

## 페이지 111
98 CHAPTER 3. LAMINAR DIFFUSION FLAMES
Then, the temperature after complete combustion, T , at the burner outlet is:
m
T0 T0 Q (cid:18) Y0 Y0 (cid:19)
T = F + O + min F , O (3.41)
m 1+φ/φ 1+φ /φ C 1+φ/φ s(1+φ /φ)
g g p g g
T0 T0 QY0
or T = F + O + F min(φ ,1) (3.42)
m 1+φ/φ 1+φ /φ C (φ+φ ) g
g g p g
Fig. 3.9 shows the variations of T and T versus global equivalence ratio φ for a
ad m g
methane/air diffusion flame. As already pointed out, the maximum temperature T does
ad
not depend on φ but the mean temperature T varies strongly with φ . Both temperatures
g m g
are equal only for for φ = 1.vii Note that even though the results of Fig. 3.9 provide use-
g
ful insights into the temperatures reached in diffusion flames, they are not expected to be
quantitatively accurate because of the assumptions on chemistry (single-step chemistry) and
thermodynamic data (constant C ).
p
2000
1500
1000
500
)K(
serutarepmeT
Mean burner outlet temperature
Maximum temperature in burner
0.0 0.5 1.0 1.5 2.0 2.5 3.0
Global equivalence ratio f
g
Figure3.9: Maximumandmeanoutlettemperaturesinamethane/airdiffusionburnerversusglobal
equivalence ratio φ . Y0 = 1, Y0 = 0.23, T0 = T0 = 300K. The mass stoichiometric coefficient is
g F O F O
s=4,theequivalenceratioφ=17.4. TheheatcapacityisC =1400 J/kg/K andQ=50100 kJ/kg
p
(ideal single-step reaction).
viiThis finding has important consequences for pollutant formation. For example, nitric oxide (NOx) for-
mation is mainly controlled by temperature. Since the maximum temperature of a diffusion burner does not
dependonφg,pollutionlevelscannotbeadjustedeasilyusingm˙1,m˙2 orφg: independentlyoftheseparam-
eters,thediffusionflamealwaysreachesthesamemaximumtemperatureT
ad
andgenerateshighNOx levels
instoichiometricregions(i.e. inthevicinityofz=zst).

## 페이지 112
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 99
3.4 Full solutions for irreversible fast chemistry flames
Once an assumption is made for the flame structure, the mixing problem (problem 1 in Sec-
tion 3.2.4 and Fig. 3.4), providing the z-field, must be solved. The z balance equation is
(Eq. 3.13):
(cid:18) (cid:19)
∂ρz ∂ ∂ ∂z
+ (ρu z)= ρD (3.43)
∂t ∂x i ∂x ∂x
i i i
which is a simple diffusion/convection equation but is still coupled to the flame structure in
the general case through density (i.e. temperature) and velocity fields. Solving this equation
has been the topic of multiple theoretical studies in the past (Linan313, Linan and Crespo314,
Peters398)andthistextpresentsonlythesimplestcases,generallyassumingaconstantdensity,
to illustrate the main results.
3.4.1 Unsteady unstrained one-dimensional diffusion flame with in-
finitely fast chemistry and constant density
A one-dimensional unstrained diffusion flame is now considered. x denotes the direction
normal to the flame front. As previously described, flame structure relations (3.31) to (3.32)
provide the expected links between species mass fractions, temperature and mixture fraction
z(x) (x is the spatial coordinate). Once again, z(x) is still unknown. Moreover, while the
flame structure is generic, the diffusion problem depends on geometrical configuration. Initial
and boundary conditions determine z(x,t).
Inaconstantpressureflame,densityρandtemperatureT arerelatedbyρ(z)=ρ T /T(z)
1 1
where the index 1 corresponds to a reference state (for example, the fuel stream). Eq. (3.13)
is then written:
(cid:18) (cid:19)
∂ρ(z)z ∂ ∂ ∂z
+ (ρ(z)uz)= ρ(z)D (3.44)
∂t ∂x ∂x ∂x
showing that the mixture fraction z field cannot be determined without assumptions on the
flamestructureρ(z). Infact,problems1(mixing)and2(flamestructure)arestronglycoupled
and cannot be solved independently.
Many diffusion flame studies overcome this difficulty assuming constant density flows.viii
In this situation, mixing andflame structure problems are decoupled and Eq. (3.13)becomes:
(cid:18) (cid:19)
∂z ∂ ∂ ∂z
+ (uz)= D (3.45)
∂t ∂x ∂x ∂x
Adiffusionflameinaconstantdensityzerovelocityflowisfirstconsidered. Attimet=0,
pure fuel for negative x and pure oxidizer for positive x are set (Fig. 3.10). Accordingly, the
initial z-field is:
z(x,t=0)=1−H(x) (3.46)
viiiThisassumptionis,apriori,verycrude. Infact,usingtheHowarth-Dorodnitzyntransformation,balance
equationsareformallythesameforconstantandnonconstantdensityflowsasshowninSection3.4.5.

## 페이지 113
100 CHAPTER 3. LAMINAR DIFFUSION FLAMES
z Ignited flame
started at t=0
Pure fuel Pure oxidizer
1
x
x=0
Figure 3.10: Initialization of an unstrained time-dependent diffusion flame.
where H is the Heaviside function. Boundary conditions are:
z(−∞,t)=1 ; z(+∞,t)=0 (3.47)
If the flow is not moving before ignition, the flow velocity remains zero afterwards be-
causedensityisconstant. AssumingaconstantdiffusioncoefficientD, thez-balanceequation
reduces to:ix
∂z ∂2z
=D (3.48)
∂t ∂x2
√
corresponding to the usual heat diffusion equation. Replacing variables (x,t) by η =x/2 Dt
leads to:
∂2z ∂z
+2η =0 (3.49)
∂η2 ∂η
which has the simple solution verifying initial (3.46) and boundary (3.47) conditions:
1 x
z = [1−erf(η)] with η = √ (3.50)
2 2 Dt
The exponential error function is defined as:
2 Z η
erf(η)= √ e−x2 dx (3.51)
π
0
It verifies erf(−∞) = −1 and erf(+∞) = 1 and is tabulated in mathematical handbooks or
available in scientific computational libraries.
Themixturefractionz(x,t)followsasimilaritysolutionz(x,t)=z(η). Likeinanydiffusion
problem in an infinite medium, no natural length scale is associated to this solution. A
√
penetration length may be defined as ∆ = 2 Dt: z depends only on x/∆. The thickness of
√
the unstrained diffusion region increases with time as Dt.
ixIn most combustion studies, ρD is assumed to be constant. Combining this assumption with constant
densityleadstoaconstantdiffusioncoefficientD.

## 페이지 114
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 101
1.0
0.8
0.6
0.4
0.2
0.0
snoitcarf
ssaM
Fuel 2000 Temperature
Oxidizer
1600
1200
800
400
0.0 0.2 0.4 0.6 0.8 1.0 0.0 0.2 0.4 0.6 0.8 1.0
Mixture fraction z Mixture fraction z
Figure 3.11: Flame structure in the z diagram for a CH /air ideal diffusion flame. The inlet air
4
and fuel temperatures are equal to 300 K. The z stoichiometric value is z =0.054 (Table 3.4).
st
As an example, Fig. 3.11 displays the flame structure (T(z), Y (z) and Y (z)) for a one-
F O
dimensional flame of pure methane and air. For this case, Table 3.4 indicates that z =
st
0.054. The maximum flame temperature obtained here is 2200 K using a heat of reaction
Q = 50100 kJ/kg (Table 2.1) and C = 1400 J/kg/K. Eq. (3.50) provides the evolution of z
p
versus η =x/∆: Fig. 3.12 shows the z profile obtained at a given instant. Since temperature
and species mass fractions are directly linked to z through the relations shown in Fig. 3.11,
they can also be obtained and are displayed in Fig. 3.12.
1.0
Fuel Y F 2000 Temperature
0.8 Oxidizer Y
O
Mixture fraction z
0.6 1500
0.4
1000
0.2
500
0.0
-4 -2 0 2 4 -4 -2 0 2 4
Reduced abscissa h Reduced abscissa h
Figure 3.12: Flame structure in the physical space for a CH /air ideal diffusion flame. Air is
4 √
preheated at 600 K, fuel temperature is 300 K. The reduced abscissa is η=x/2 Dt.

## 페이지 115
102 CHAPTER 3. LAMINAR DIFFUSION FLAMES
The flame position x is given at each instant:
f
(cid:18) (cid:19)
x φ−1
η = √f =erf−1(1−2z )=erf−1 (3.52)
f 2 Dt st φ+1
√
Forthisflame,η =1.14andtheflamepositioninphysicalspaceisgivenbyx =2.28 Dt.
f f
Even though the flame is slightly moving, the corresponding velocity dx /dt is always small
f
compared to a premixed flame speed.x
The fuel reaction rate per unit flame area, Ω˙ , may be expressed integrating Eq. (3.7)
F
between x− and x+ where x− and x+ are two points located on both sides of the flame front,
f f f f
infinitely close to it (see Fig. 3.13):xi
Ω˙ = Z x+ f ω˙ dx=− (cid:20) ρD ∂Y F (cid:21)x+ f = (cid:20) ρD ∂Y F (cid:21) = (cid:20) ρD ∂Y F (cid:21) (cid:20) ∂z (cid:21) (3.53)
F F ∂x ∂x ∂z ∂x
x− x− x=x− x=x− x=x−
f f f f f
Y0 (cid:20) ∂z (cid:21) Y0 r D
or Ω˙ F =ρD 1− F z ∂x =−ρ 2(1− F z ) πt e−η f 2 (3.54)
st x=x− st
f
Reaction rate
Fuel mass fraction
Abscissa
xf- xf xf+
Figure 3.13: Estimation of the reaction rate for a diffusion flame with infinitely fast chemistry.
√
This reaction rate goes to zero like 1/ t: the diffusion of reactants towards the reaction
zone (and the combustion rate) is slowed down because of the accumulation of products near
theflamefront. Astimegoesby,anunstraineddiffusionflamegetschokedinitsownproducts.
xMoregenerally,theflameismovingtowardsthedeficientreactant: fuelforφ<1andoxidizerforφ>1.
Itstaysatx =0forstoichiometricconditions(φ=1).
f
xiThe integrated reaction rate is finite even though chemistry is infinitely fast. In this situation, the com-
bustionrateisnotlimitedbychemicalprocessesintheflamezonebutbymoleculardiffusionratesofthefuel
andoxidizertowardsthereactionzone,accordingto:
Ω˙ F =
h
ρD
∂YF i
=−s
h
ρD
∂YO i
∂x x=x− ∂x x=x+
f f

## 페이지 116
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 103
3.4.2 Steady strained one-dimensional diffusion flame with infinitely
fast chemistry and constant density
Oxidizer
x1
Flame (x1=xf)
x2
Fuel
Figure 3.14: Steady strained one-dimensional diffusion flame.
Theabovesolutionhasbeenderivedforanunsteadyunstraineddiffusionflame(Fig.3.2a).
Thisderivationmaybeeasilyreproducedforasteadystraineddiffusionflame(Fig.3.14). For
such a flame, all the previous analysis related to flame structure remains valid but the mixing
problem is different. The flame is steady because the flow is strained. Assuming constant
density, the imposed velocity field corresponds to:
u =−ax and u =ax (3.55)
1 1 2 2
which satisfies the continuity equation. The x = 0 plane is a stagnation plane and a is the
1
strain rate (s−1), assumed to be constant.xii
The z balance equation in such a flame is:
(cid:18) (cid:19) (cid:18) (cid:19)
∂ρz ∂ ∂ ∂ ∂z ∂ ∂z
+ (ρu z)+ (ρu z)= ρD + ρD (3.56)
∂t ∂x 1 ∂x 2 ∂x ∂x ∂x ∂x
1 2 1 1 2 2
Even though the z-field is one-dimensional, the term ∂(ρu z)/∂x must be retained because
2 2
u depends on x . Using the continuity equation, the z equation may be rewritten under a
2 2
non-conservative form:
(cid:18) (cid:19) (cid:18) (cid:19)
∂z ∂z ∂z ∂ ∂z ∂ ∂z
ρ +ρu +ρu = ρD + ρD (3.57)
∂t 1∂x 2∂x ∂x ∂x ∂x ∂x
1 2 1 1 2 2
xiiInarealburner,thestagnationpointflowconfigurationisachievedbyplacingfuelandoxidizerjetsface
toface. Thestrainrateattheflameisnotknownaprioriinsuchcasesbecausethevelocityfieldneedstobe
measured and strain is not constant along the flame normal, leading to some difficulties in the definition of
strain. However,theorderofmagnitudeoftheflamestrainiseasytoestimatefromthevelocitiesofthejets
U1 andU2 andthedistancebetweenthejetsH:
a=
|U1|+|U2|
H

## 페이지 117
104 CHAPTER 3. LAMINAR DIFFUSION FLAMES
On the axis normal to a steady strained flame, assuming constant density and diffusion coef-
ficient, this z equation then reduces to:
∂z ∂2z
−ax =D (3.58)
1∂x ∂x2
1 1
p
Replacing x by ζ =x a/2D gives:
1 1
∂2z ∂z
+2ζ =0 (3.59)
∂ζ2 ∂ζ
whichisEq.(3.49),withidenticalboundaryconditions(Eq.3.47): z(+∞)=0andz(−∞)=1.
The solution is then:
r
1 a
z = [1−erf(ζ)] with ζ =x (3.60)
2 1 2D
Comparing expressions for ζ (steady strained flame) and η (unsteady unstrained flame):
r
a x
ζ =x and η = √1 (3.61)
1 2D 2 Dt
shows that the strain rate a and the inverse of time 1/2t play similar roles. An unsteady
unstrained flame at time t has exactly the same spatial structure as a steady strained flame
with a strain a=1/2t. All solutions derived for the unsteady unstrained flame can be simply
extended to the steady strained flame by replacing t by 1/2a in the previous expressions. For
example, the integrated fuel reaction rate along the flame normal Ω˙ is:
F
Ω˙ = Z x+ 1f ω˙ dx =− (cid:20) ρD ∂Y F (cid:21)x+ 1f =ρD (cid:20) ∂Y F (cid:21) (3.62)
F F 1 ∂x ∂x
x−
1f
1 x−
1f
1 x1=x−
1f
r
Y0 aD
or Ω˙ F =−ρ 1− F z 2π e−ζ f 2 (3.63)
st
where ζ corresponds to the flame location and is given by:
f
r (cid:18) (cid:19)
a φ−1
ζ =x =erf−1(1−2z )=erf−1 (3.64)
f 1f 2D f φ+1
For φ<1, or z >0.5 the flame is located on the fuel side (x <0) of the stagnation plane
st 1f
x = 0. For φ > 1 (z < 0.5), x > 0 and the flame is located on the oxidizer side of the
1 st 1f
stagnation plane. The flame front is always located on the deficient reactant side and lies on
the stagnation plane only when φ = 1 (z = 0.5), i.e. when reactants are in stoichiometric
st
proportions.

## 페이지 118
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 105
As shown in Section 3.2.2, the scalar dissipation rate of the mixture fraction, χ, is a key
quantity in diffusion flame descriptions. For a one-dimensional strained flame with constant
density,xiii the scalar dissipation rate χ is given, from Eq. (3.60), by:
(cid:18) ∂z (cid:19)2 a (cid:16) a (cid:17)
χ=2D = exp − x2 (3.65)
∂x π D 1
1
depends on the location x and is maximum on the stagnation plane (x = 0). Combining
1 1
Eq. (3.60) and (3.65) leads to:
χ= a exp (cid:16) −2 (cid:2) erf−1(1−2z) (cid:3)2(cid:17) =χ exp (cid:16) −2 (cid:2) erf−1(1−2z) (cid:3)2(cid:17) =χ F(z) (3.66)
π 0 0
whereχ isthemaximumvalueofthescalardissipationrateinthesteadystrainedflame,cor-
0
responding to the stagnation plane (x =0). For infinitely fast irreversible chemical reaction,
1
its value on the flame front is:
a
" (cid:18) (cid:18)
φ−1
(cid:19)(cid:19)2 #
χ = exp −2 erf−1 (3.67)
f π φ+1
10
8
6
4
2
0
)s/1(
noitapissid
ralacS
Flame position
(z=zst)
Scalar dissipation
at z=zst
-4 -2 0 2 4
Reduced abscissa eta
Figure 3.15: Scalar dissipation rate versus reduced abscissa η in a constant density methane/air
flame (strain rate a=30s−1).
For example, Fig. 3.15 shows the profile of scalar dissipation rate χ corresponding to
the constant density flame example displayed on Fig. 3.12. Assuming a typical value D =
1.510−5m2/sandanequivalentstrainrateof30s−1,maximumvaluesofthescalardissipation
xiiiThis expression for the scalar dissipation rate χ does not require an infinitely fast chemistry and comes
fromEq.(3.59)andboundaryconditionsz(+∞)=0andz(−∞)=1.

## 페이지 119
106 CHAPTER 3. LAMINAR DIFFUSION FLAMES
rate are of the order of 10s−1. The stoichiometric value of scalar dissipation rate is obtained
using Eq. (3.67) and is much lower: χ =0.9s−1.
st
Relations (3.65) and (3.67) show that scalar dissipation rate and strain rate are closely
related. In a steady one-dimensional strained flame, the strain rate a is constant whereas the
scalar dissipation rate χ depends on the spatial location x. On the other hand, strain rates
areonlylinkedtoflowfieldcharacteristics(localvelocitygradients)whereasscalardissipation
ratesmeasuremixingproperties(infact,mixturefractiongradients),incorporatemassfraction
values through z and are able to handle partially premixed situations (the equivalence ratio
φ is found in Eq. 3.67).
3.4.3 Unsteady strained one-dimensional diffusion flame with in-
finitely fast chemistry and constant density
Intheprevioussection,thestructureofasteadystainedone-dimensionalflamewithinfinitely
fast chemistry, assuming constant density, has been described. The extension of this study to
transient phenomena is interesting. Starting from a steady strained one-dimensional diffusion
flame (strain rate a ), the strain rate is supposed to be instantaneously set to a new value a
0
at time t=0. The z-balance equation (3.58) is replaced by:
∂z ∂z ∂2z
−ax =D (3.68)
∂t 1∂x ∂x2
1 1
with the same boundary conditions: z(−∞,t) = 1 (pure fuel) and z(+∞,t) = 0 (pure ox-
idizer). As a steady solution is expected for negative times (strain rate a ) and for infinite
0
positive times (strain rate a), the unsteady solution is searched as:
(cid:20) (cid:18)r (cid:19)(cid:21)
1 a
z = 1−erf f(t)x (3.69)
2 2D 1
with:
r
a
f(t≤0)= 0 ; f(t=+∞)=1 (3.70)
a
Substituting Eq. (3.69) into Eq. (3.68) leads to:
∂f
−af +af3 =0 (3.71)
∂t
which has an explicit solution:
s
a e2at
f(t)= 0 (3.72)
a+a (e2at−1)
0
Accordingly, the flame response time to a strain rate change is of the order of 1/a and may
be non negligible, despite of the infinitely fast chemistry assumption (this time corresponds

## 페이지 120
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 107
to a diffusion time, controlling the flame response). For example, for typical strain rates
between 10 s−1 and 1000 s−1, this response time lies between 1 and 100 ms, corresponding
to a downstream distance of 0.01 to 1 m in a 10 m/s flow. These unsteady effects are easy to
identifyusingEq.(3.69): theunsteadyflamesubmittedtoastraina(t)hasthesamestructure
at time t as a steady flame submitted to a strain aeq = a(t)f(t)2. Knowing aeq completely
determines the flame structure. This “equivalent” strain rate aeq is, using Eq. (3.72):
a e2at
aeq =af2(t)=a 0 (3.73)
a+a (e2at−1)
0
As an example, Fig. 3.16 shows the equivalent strain rate controlling a diffusion flame sub-
mitted to a step function of strain from a to 10a .
0 0
1.0
aeq/ a
0.8
0.6
0.4
0.2
0.0
-1 0 1 2 3 4 5
a t
Figure 3.16: Response of a one-dimensional laminar diffusion flame to an instantaneous change of
the strain rate. At time t = 0, the strain rate induced by the flow ( ) field suddenly increases
from a to a (here a/a =10.). The equivalent strain rate aeq (Eq. 3.73) is plotted as a function of
0 0
the reduced time at ( ).
This flame response time to strain rate changes has various consequences:
• A laminar diffusion flame is able to sustain high strain rates (higher than the extinction
strainratedeterminedinsteadyflames,see§3.5.2)ifitisnotsubmittedtotheseduring
too long times (typically of the order of 1/a).
• Adiffusionflameactsasalowpassfilterandcannotreacttohighfrequencies(typically
higher than a) perturbations (Darabiha125).
• The equivalent strain rate notion is interesting because an unsteady strained flame may
be described as a steady strained one. This is a way to introduce unsteady effects in
flamelet models (see Chapt. 6) for turbulent combustion (Haworth et al.211).

## 페이지 121
108 CHAPTER 3. LAMINAR DIFFUSION FLAMES
)x(z
melborp
gnixim
fo
noituloS
sretemarap
lacisyhP
i(cid:17)
p
(cid:16)
h1
erutxiM
)
W ν(/)
W
ν(=s
s oitar
cirtemoihciotS
)D2(/κ
x
fre−1
F F
O
O
2
)x(z
noitcarf
0Y/0Ys=φ
φ
oitar
ecnelaviuqE
O
F
noitapissid
ralacS
(cid:1)
D/2xκ−
(cid:0) pxeπ/κ
erutxim
cirtemoihciotS
1
1
χ etar
1+φ
= 0Y/0Ys+1
=
ts
z
O
F
ts z noitcarf
2(cid:1)(cid:1)
1 1 − +φ
φ
(cid:0)
1−fre
(cid:0) − eκD
p
0 F Yρ
detargetnI
π2
tsz−1
emafl
citabaidA
F
Ω˙
etar
noitcaer
p C/
ts z0 F
YQ+
O 0T)
ts z−1(+
0 F
T ts
z= da
T
T erutarepmet
da
κ etar
niarts
tnelaviuqE
emafl
deniartsnu
ydaetsnU
t2/1
)margaid
z(
erutcurts
emafl
fo noitpircseD
)1.4.3
§(
edis
rezidixO
edis
leuF
emafl
deniarts
ydaetS
a
.0
)
z−1(/)
z−z(0Y
)z(
Y
)2.4.3
§(
ts
ts
F
F
)1(
emafl
deniarts
ydaetsnU
)
z/z−1(0Y
.0
)z(
Y
)ta2−e−1(/a
ts
O
O
)3.4.3
§(
z0
F
YQ
+
0T)z−1(+
0Tz
ts
z)z−1(0
F YQ
+
0T)z−1(+
0Tz
)z(T
C
O
F
z−1
C
O
F
ta2e
a
)2(
emafl
deniarts
ydaetsnU
p
ts
p
0
a
)1−ta2e(
a+a 0
)3.4.3
§(
dna
toneuC(
ytisned
tnatsnoc
htiw
semafl
noisuffid
lanoisnemid-eno
rof
stluser
lacitylana
niam
fo
yrammuS
:5.3
elbaT
edisivaeH
na
htiw
0
= t
emit
ta
trats
)1(
emafl
deniarts
ydaetsnu
eht
dna
emafl
deniartsnu
ydaetsnu
ehT
.)221tosnioP
deniarts
ydaets
a ot
sdnopserroc
)2(
emafl
deniarts
ydaetsnu
eht
rof
noitulos
laitini
ehT
.))x(H−1
=
)0
= t,x(z(
noitcnuf
tnelaviuqe
na
fo
smret
ni
desserpxe
era
snoituloS
.a
ot
tes
ylneddus
si etar
niarts
eht
,0
= t emit
tA
.)
a etar niarts(
emafl
0
.κ
etar
niarts

## 페이지 122
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 109
The previous results are summarized in Table 3.5. A second unsteady strained flame
solution, proposed by Cuenot and Poinsot122, has been added and assumed a step function
for z at initial time t=0 (i.e. z(x,t=0)=1−H(x) where H is the Heaviside function). In
fact, this situation is the limiting case a =+∞ of the previous unsteady case.
0
3.4.4 Jet flame in an uniform flow field
Anothersimpleexampleofdiffusionflameisthesteadytwo-dimensionaljetflame(Fig.3.17).
x
2
z
Oxidizer
Flame
Fuel
2e0
L
f
Figure 3.17: Jet diffusion flame. A plane fuel jet (height 2e ) is injected with an oxidizer coflow.
0
A plane fuel jet (fuel mass fraction Y0, density ρ0 and inlet velocity u0) is injected into
F F F
an oxidizer coflow (oxidizer mass fraction Y0, density ρ0 and inlet velocity u0). The flow is
O O O
assumed to be uniform and one-dimensional to lead to a simple analytical solution:
• constant inlet mass flow rate: ρ0u0 =ρ0u0 =constant.
F F O O
• one-dimensional flow: u =u =0.xiv
2 3
• ρD is assumed to be constant (ρD =ρ0D =ρ0D ).
F F O O
Under these assumptions, the continuity equation (1.36) reduces to:
∂(ρu )
1 =0=⇒ρu =ρ0u0 =ρ0u0 =constant (3.74)
∂x 1 F F O O
1
The z-balance equation (3.43) becomes similar to the usual heat diffusion balance equation:
∂z ∂2z
ρ0u0 =ρ0D (3.75)
F F∂x F F∂x2
1 2
with the boundary conditions:
xivThisassumption, initiallyintroducedbyBurkeandSchumann73, isnottrue. Aboundarylayerassump-
tion (u2 (cid:28) u1, keeping only transverse gradient of the axial velocity ∂u1/∂x2), would be more adapted.
Nevertheless,resultsdonotstronglydifferandtheproposedassumptionleadstoasimpleanalyticalsolution.

## 페이지 123
110 CHAPTER 3. LAMINAR DIFFUSION FLAMES
• x =0
1
– For x <−e or x >e , z =0.
2 0 2 0
– For −e <x <e , z =1.
0 2 0
• lim (z)=lim (z)=0.
x2→+∞ x2→−∞
Figure 3.18: Mixture fraction (z), fuel (Y ) and oxidizer (Y ) mass fractions and temperature (T)
F O
in a planar jet diffusion flame (Fig. 3.17). Chemical parameters (Y0, Y0, φ, z ,...) correspond to a
F O st
pure methane/air flame (Table 3.4).
The solution of Eq. (3.75) leads to a mixture fraction field given by:xv
!
1 Z +e0 (x −y0)2
z(x ,x )= √ exp − 2 dy0 (3.76)
1 2 2 παx 4αx
1 −e0 1
whereα=D /u0. Forlargevaluesofthedownstreamlocationx comparedtotheinitialjet
F F 1
diameter 2e , Eq. (3.76) reduces to:
0
e (cid:18) x2 (cid:19)
z(x ,x )≈ √ 0 exp − 2 (3.77)
1 2 παx 4αx
1 1
Having z(x ,x ), the flame structure is fully determined as fuel and oxidizer mass fractions
1 2
and temperature are functions of the mixture fraction z (Eq. 3.31 to 3.32). Profiles along the
jet axis x are displayed on Fig. 3.18a. Transverse profiles along x are given on Fig. 3.18b.
1 2
The flame length L may be defined as z(x =L ,x =0)=z . From Eq. (3.77):
f 1 f 2 st
e2u0 e
L = 0 F (φ+1)2 = 0R (φ+1)2 (3.78)
f πD π e
F
xvConsideringroundcoaxialjetsinsteadofplanarjetsleadstoBesselfunctions.

## 페이지 124
3.4. FULL SOLUTIONS FOR IRREVERSIBLE FAST CHEMISTRY FLAMES 111
where R = e u0/D is the fuel jet Reynolds number. The flame length increases linearly
e 0 F F
with the fuel jet velocity u0 and the fuel jet Reynolds number R .xvi
F e
3.4.5 Extensions to variable density
The previous results have been derived assuming constant density. This assumption is not
as crucial in diffusion flames as in premixed flames but may be relaxed using the Howarth-
Dorodnitzyn transformation (see LinanandCrespo314, Williams554 orCuenot and Poinsot122
for mathematical details). In this transformation, the spatial variable x is replaced by a
“mass-weighted coordinate” X defined as:
x
1 Z
X = ρ(x0,t)dx0 (3.79)
ρ
0
x0
wherex ,correspondingtodensityρ ,isareferencelocationandcouldbethestagnationplane
0 0
(x =0)ortheflamefront(x =x ). TheHowarth-Dorodnitzynapproximationmaybeused
0 0 f
with unsteady balance equations under classical boundary layer approximation (Williams554)
but is simply illustrated here, as an example, for steady one-dimensional strain flame. The
velocity field is now given by the balance continuity equation:
∂ρu ∂ρv
=− =−ρa (3.80)
∂x ∂y
The mixture fraction balance equation reduces to:
(cid:18) (cid:19)
∂z ∂ ∂z
ρu = ρD (3.81)
∂x ∂x ∂x
Replacing x by X (Eq. 3.79) leads to:
∂ ∂X ∂ ρ ∂
= = (3.82)
∂x ∂x ∂X ρ ∂X
0
The continuity equation (3.80) becomes:
∂ρu
=−ρ a =⇒ ρu=−ρ aX (3.83)
∂X 0 0
assuming that X = 0 (x = 0) corresponds to the stagnation plane. The mixture fraction
0
balance equation (3.81) is then rewritten:
(cid:18) (cid:19)
ρ ∂z ρ ∂ ρ ∂z
−ρ aX = ρD (3.84)
0 ρ ∂X ρ ∂X ρ ∂X
0 0 0
xviThis result is true as long as the flow remains laminar (see Chapt. 4): for large values of the Reynolds
number,atransitiontowardsturbulentflowsisexpected.

## 페이지 125
112 CHAPTER 3. LAMINAR DIFFUSION FLAMES
leading to, if ρ2D =ρ2D is supposed to be constant:xvii
0 0
∂z ∂2z
−aX =D (3.85)
∂X 0∂X2
which is exactly Eq. (3.58) with the same boundary conditions z(−∞) = 1 and z(+∞) = 0.
The solution can be obtained from Table 3.5, replacing x by X and defining η by (see, for
example, Cuenot and Poinsot122):
r
κ
η = X (3.86)
D
0
The Howarth-Dorodnitzyn transformation is a useful tool for analytical derivations and
allows flame numerical simulations using a constant density code. Unfortunately, to come
back to physical space, replacing the “mass-weighted coordinate” X by the actual spatial
coordinate x involves inverting Eq. (3.79) and is generally not obvious without additional
assumptions.
3.5 Extensions of theory to other flame structures
Theirreversibleinfinitelyfastchemistryassumptionallowsderivationsofdiffusionflamebasic
properties but has to be relaxed to address more realistic cases.
3.5.1 Reversible equilibrium chemistry
When chemical reactions controlling a diffusion flame are not irreversible, fuel, oxidizer and
products may coexist at the same location, leading to a more complex flame structure. Even
though chemistry may proceed infinitely fast, the flame structure differs from the one ob-
served for irreversible infinitely fast chemistry: at each point in the z diagram, fuel, oxidizer
andproductsmassfractionsmustsatisfytheequilibriumcondition(3.27). Anexampleofcor-
responding flame structure is displayed on Fig. 3.19. This structure does not depend on any
flow characteristic time since chemistry is assumed to be infinitely fast and scalar dissipation
χ is zero.
3.5.2 Finite rate chemistry
AllresultspresentedinSections3.3and3.4assumeaninfinitelyfastchemistry,comparedtoall
othertimescales. Whenthisassumptionisnolongervalid, theflamestructurebecomesmore
complex and is expected to depend on flow times. Flow effects on diffusion flame structure
are generally quantified using the Damk¨ohler number:
τ
Dfl = f (3.87)
a τ
c
xviiThisassumptionρ2D=constantisusualinanalyticalderivationsfordiffusionflames.

## 페이지 126
3.5. EXTENSIONS OF THEORY TO OTHER FLAME STRUCTURES 113
Equilibrium lines
Temperature
: possible states
TO 0
TF 0
Mixing line
0 zst 1 z
Fuel mass Equilibrium lines YF 0
fraction
Mixing line
0 zst 1 z
Oxidizer mass Mixing line
fraction YO 0
Equilibrium lines
0 zst 1 z
Figure 3.19: Diffusion flame structure in z diagram for reversible infinitely fast chemistry (equilib-
rium).
where τ and τ are respectively flow and chemical time scales. Defining this flow time scale
f c
τ is a first difficulty. For an unsteady unstrained flame (Fig. 3.2a), there is no flow-imposed
f
reference time and the proper time τ is the age of the flame so that the Damk¨ohler number
f
increases with time. For a strained flame (Fig. 3.2b), a possible time scale is the inverse of
flame strain 1/a so that the Damk¨ohler number is constant as long as strain is constant. For
the moment, only steady strained flames are considered.
For infinitely fast chemistry, the chemical time τ is small compared to the flow time scale
c
τ and the Damk¨ohler number is infinite. When Dfl takes finite values, finite rate chemistry
f a
becomes important and must be taken into account. In practice, chemistry effects are only
important in the zone where reaction takes place and, like for premixed flames, this zone
usually remains small (see Fig. 3.1). Outside this region, combustion is zero and all concepts
developed for infinitely fast chemistry apply. For example, the z-diagram is only affected in
the vicinity of the flame front i.e. for z of the order of z . Fig. 3.20 shows the evolution of
st
z diagrams when chemistry gets slower. Fuel and oxidizer now exist together in the reaction
zone. The maximum temperature is lower than the temperature found for infinitely fast

## 페이지 127
114 CHAPTER 3. LAMINAR DIFFUSION FLAMES
chemistry. But outside the reaction zone, the flame structure is identical.
Infinitely fast chemistry
Temperature
Finite rate chemistry
possible states with
TO0 Mixing line i
c
n
h
fi
e
n
m
ite
i
l
s
y
t r
f
y
ast irreversible
TF0
0 zst 1 z
F
fr
u
a
e
c
l
t
m
io
a
n
ss Mixing line YF0
Finite rate chemistry
Infinitely fast chemistry
0 zst 1 z
Oxydizer mass Mixing line
fraction YO0
Finite rate chemistry
Infinitely fast chemistry
0 zst 1 z
Figure 3.20: Evolution of z diagrams when chemistry evolves from infinitely fast to finite rate
chemistry (irreversible reaction).
Describing the details of the analyses required to construct solutions for strained diffusion
flameswithfiniteratechemistryisbeyondthescopeofthistext. Multipleresultsoftheseanal-
yses, however, are required to understand these flames and perform numerical computations
of their structure. These results are now briefly summarized.
As evidenced by Eq. (3.21) and (3.26), and also confirmed by asymptotic analysis, the
scalardissipationrateχisakeyquantityindiffusionflamestudies. Thescalardissipationrate
measuresmixturefractiongradients,isdirectlyrelatedtothestrainrate(seeEq.3.65)xviii and
appears as a relevant quantity to define a flow time scale τ entering the Damk¨ohler number
f
definition: this mixing time scale may be estimated as the inverse of the scalar dissipation at
the stoichiometric point: τ ≈1/χ .
f st
Various definitions may be found in literature for the Damk¨ohler number Dfl but asymp-
a
totic analysis (Linan313, Cuenot and Poinsot122, Vervisch and Poinsot527) provides its most
xviiiEq.(3.65)holdsforsteadyone-dimensionalconstantdensitystraineddiffusionflamesanddoesnotrequire
aninfinitelyfastchemistryassumption.

## 페이지 128
3.5. EXTENSIONS OF THEORY TO OTHER FLAME STRUCTURES 115
relevant form. When the fuel reaction rate is written (see Eq. (1.24) and (1.25)):
(cid:18)
ρ
(cid:19)νF (cid:18)
ρ
(cid:19)νO
ω˙ F =ν F W F A Y FW Y OW e−T T a (3.88)
F O
the Damk¨ohler number should be:
ν A (cid:18) Y0 (cid:19)νF−1(cid:18) Y0 (cid:19)νO
D
a
fl = 32
χ
F ρν
f
O+νF−1φνO(1−z
st
)2
W
F
W
O ·
st F O (3.89)
(cid:18) Q T Y a 2 d 0 / / T C a (cid:19)νO+νF+1 e− T T a a d
F p
where Y0 and Y0 are the fuel and oxidizer mass fractions in the fuel and oxidizer streams
F O
respectively, ρ is the density at the stoichiometric point, φ the equivalence ratio and χ the
f st
scalar dissipation at the stoichiometric point: χ =2(λ /ρ C )|∇z|2 (this result is obtained
st f f p f
assuming that ρλ = ρ λ is constant). T is the adiabatic flame temperature given by
f f ad
Eq. (3.34).
Infinitely fast chemistry
Scalar dissipation at
stoichiometric point (c st)
or
Flame strain (a)
or
Finite rate chemistry Inverse Damkohler (Da -1)
Quenching
Figure 3.21: Integrated reaction rate Ω˙ as a function of strain rate a, stoichiometric scalar dissi-
F
pation rate χ or inverse of the Damk¨ohler number Dfl for infinitely fast and finite rate chemistry.
st a
TheevolutionofstagnationpointflameswithDamk¨ohlernumberchangeshasbeenstudied
intermsofmaximumtemperatureandintegratedreactionrateΩ˙ usingasymptoticmethods
F
(Linan313, Clavin and Lin˜´an106, Williams554). Fig. 3.21 shows how the integrated reaction
rate depends on scalar dissipation (or on strain or on the inverse of the Damk¨ohler number):
increasing strain rate on diffusion flames first promotes combustion because the straining ve-
locityfieldbringsmorefuelandoxidizertothereactionzone. Thisevolutionisalsopredicted
for infinitely fast chemistry (see Table 3.5 or Eq. 3.63), showing that the magnitude of Ω˙ in-
F
creaseslikethesquarerootofthestrainrate. But,forsufficientlylargestrainrates,chemistry
becomes a limiting factor: chemical reactions have more difficulty keeping up with the rate
at which fuel and oxidizer enter the reaction zone. Eventually, chemistry becomes too slow
to burn the incoming reactants and quenching occurs for a value of the Damk¨ohler number

## 페이지 129
116 CHAPTER 3. LAMINAR DIFFUSION FLAMES
(providedbyasymptotictheory)Dfl,q. ForunityLewisnumberandifoneofthetwostreams
a
is preheated, the quenching Damk¨ohler is (Cuenot and Poinsot122):
2 h m i
Dfl,q =(1.359m) 1− (1+ν ) (3.90)
a ν ! 2 O
O
where
(cid:18) T0 −T0(cid:19)
m=2(1−z ) 1− O F −2 (3.91)
st QY0/C
F p
A more general scaling is proposed by Peters398 for the quenching scalar dissipation χq :
st
z2(1−z )2
χq = st st (3.92)
st τp
c
where τp is simply the flame time corresponding to a premixed stoichiometric flame: τp =
c c
δ/s0 = D/(s0)2. This scaling illustrates the link between premixed and diffusion flame
L L
parameters: if the stoichiometric speed of the premixed flame is large, the quenching scalar
dissipation of the diffusion flame is also large.
3.5.3 Summary of flame structures
Table 3.6 summarizes flame structures as a function of assumptions used for reversibility
and equilibrium. On the left side, infinitely fast chemistry (equilibrium) assumptions lead
to structures independent on the strain rate applied to the flame. On the right side, finite
rate chemistry effects (non equilibrium) increase with strain rate (i.e. when the Damk¨ohler
number decreases). For very low strain rates values, the infinitely fast structure is recovered.
Note that a reversible equilibrium flame produces a structure similar to finite rate chemistry
flames at fixed strain.
3.5.4 Extensions to variable Lewis numbers
ThepreviousanalysisassumedthatallLewisnumberswereequaltounitytointroducemixture
fractionconcepts. Thisassumptionmayalsoberelaxed. Foreveryspecieshavinganon-unity
Lewis number, a new passive scalar must be introduced but the mathematics can be worked
out. Examples of such studies are given in Seshadri and Peters479, Seshadri et al.480, Cuenot
and Poinsot122, Seshadri478 or Pitsch and Peters407.

## 페이지 130
3.5. EXTENSIONS OF THEORY TO OTHER FLAME STRUCTURES 117
)MUIRBILIUQE
NON(
YRTSIMEHC
ETAR
ETINIF
)MUIRBILIUQE(
YRTSIMEHC
TSAF
timil
yrtsimehc
tsaf
yletinifnI
erutarepmeT
erutarepmeT
yrtsimehc
etar
etiniF
niarts
fo
tnednepednI
)niarts
wol(
yrtsimehc
etar
etiniF
ELBISREVERRI
)niarts
hgih(
NOITCAER
0
OT
0 OT
0
FT
0 FT
enil
gnixiM
enil
gnixiM
1
tsz
0
1
tsz
0
timil
yrtsimehc
tsaf
yletinifnI
erutarepmeT
erutarepmeT
yrtsimehc
etar
etiniF
niarts
fo
tnednepednI
)niarts
wol(
yrtsimehc
etar
etiniF
)niarts
hgih(
ELBISREVER
NOITCAER
0
OT
0 OT
0 FT
enil
gnixiM
0
FT
enil
gnixiM
1
tsz
0
1
tsz
0
suoirav
gnisu
,z
noitcarf
erutxim
eht
susrev
erutarepmet
rof
dettolp
serutcurts
emafl
noisuffid
fo
yrammuS
:6.3
elbaT
.deeps
yrtsimehc
dna
ytilibisrever
no
snoitpmussa

## 페이지 131
118 CHAPTER 3. LAMINAR DIFFUSION FLAMES
3.6 Real laminar diffusion flames
3.6.1 One-dimensional codes for laminar diffusion flames
Even though the analysis derived in the previous section is useful to understand diffusion
flame, the corresponding derivations are usually not exact for real flames for various reasons:
• Multiple chemical species, including radicals and multiple reactions have to be taken
into account. Some of these reactions may be reversible.
• Species molecular diffusion coefficients are generally not equal. Species like H or H
2
diffuse much faster than heavy molecules.
• Heat (λ/(ρC )) and species (D ) diffusivities differ so that the analogy needed between
p k
heat and species in the ideal flame theory is never satisfied.
These phenomena make analytical solutions difficult to derive. However, numerical so-
lutions which do not require simplifications can still be performed and full computations of
one-dimensional diffusion flames are performed easily today, as done for premixed flames in
Section 2.3. For example, Fig. 3.22 displays temperature and species mass fraction profiles
in a H - O diffusion flame at atmospheric pressure (Vermorel524). The hydrogen stream
2 2
temperature is 300 K and the oxygen is heated to 750 K. The strain rate is 300 s−1.
The literature about stagnation point diffusion flames is abundant and multiple tools for
one-dimensional flames are available (Darabiha and Candel126, Barlow and Chen21, Pitsch
and Peters407).
3.6.2 Mixture fractions in real flames
Numerical studies of laminar diffusion flames do not require the use of passive scalars. How-
ever, they are useful for results postprocessing and analysis. Their definition has then to be
revisitedbecausequantitiesdefinedbyEq.(3.15)arenotpassivescalarsanymore. Otherpas-
sive scalars may still be constructed using atomic elements as described below. Consider the
generic case of N species reacting through M chemical reactions. The jth reaction is written:
N N
X ν0 M *) X ν 00 M for j =1,M (3.93)
kj k kj k
k=1 k=1
Each species contains from 1 to a maximum of P elementary elements. For most hydro-
carbonflamesP =4: C, O, H, N. Themassfractionofthep-elementisdefinedas(forp=1
to P, P being the total number of elements):
N N
Z = X a W pY =W X a Y k (3.94)
p kpW k p kpW
k k
k=1 k=1

## 페이지 132
3.6. REAL LAMINAR DIFFUSION FLAMES 119
1.0
0.8
0.6
0.4
0.2
0.0
−1.0 −0.5 0.0 0.5 1.0
x [cm]
Y
0.060
H2 0.040 O2
OH
H2O
0.020
0.000
−1.0 −0.5 0.0 0.5 1.0
x [cm]
Y
H O
2e−04
1e−04
0e+00
−1.0 −0.5 0.0 0.5 1.0
x [cm]
Y
3000
HO2
H2O2
2000
1000
0
−1.0 −0.5 0.0 0.5 1.0
x [cm]
]K[
erutarepmeT
Figure 3.22: Structure of a H -O diffusion flame at atmospheric pressure computed with full
2 2
chemistry and transport. Strain rate: 300 s−1. From Vermorel524. Chemical scheme from Table 1.5.
where a is the number of elements of type p in species k: for example, if the species k is
kp
propane (C H ) and if carbon (C) is the element p: a = 3. The a values do not depend
3 8 kp kp
on chemical reactions taking place between species.
Now, species may be consumed or produced during chemical reactions but elements are
conserved so that, for reaction j:
N N
X a (ν0 −ν 00 )= X a ν =0. (3.95)
kp kj kj kp kj
k=1 k=1
Multiplying each species conservation equations (1.37) by a W /W and summing them
kp p k
from k =1 to N yields a balance equation for Z :
p
(cid:18) (cid:19)
∂ρZ ∂ ∂ ∂Z
p + (ρu Z )= ρD p +S (3.96)
∂t ∂x i p ∂x ∂x p
i i i
where all molecular diffusion coefficients are assumed to be equal (D =D).
k
The source term S for Z is:
p p
M N M N M N
S = XX W pa w˙ = XX W a (ν0 −ν 00 )Q =W X Q X a ν =0 (3.97)
p W kp kj p kp kj kj j p j kp kj
k
j=1k=1 j=1k=1 j=1 k=1

## 페이지 133
120 CHAPTER 3. LAMINAR DIFFUSION FLAMES
expressing w˙ from Eq. (1.22) and using the conservation relation (3.95). Therefore, as ex-
k
pected, a convection/diffusion balance equation without source term is derived for Z :
p
(cid:18) (cid:19)
∂ρZ ∂ ∂ ∂Z
p + (ρu Z )= ρD p (3.98)
∂t ∂x i p ∂x ∂x
i i i
For example, consider the H -O flame displayed on Fig. 3.22 (z = 0.111). The species
2 2 st
usedinthecomputationwere: H ,H,O ,O,H O,OH,H O ,HO andN (N =9). Three
2 2 2 2 2 2 2
elements are considered H, O and N (P = 3). The stoichiometric ratio s is 8. The scalar
z defined by Eq. (3.15) and constructed using mass fractions of fuel and oxidizer is given for
1
this flame by:
sY −Y +Y0
z = F O O (3.99)
1 sY0+Y0
F O
A passive scalar Z defined for the H element for example is:
H
(cid:18) (cid:19)
2Y Y 2Y Y Y 2Y
Z =W H2 + H + H2O + OH + HO2 + H2O2 (3.100)
H H W W W W W W
H2 H H2O OH HO2 H2O2
and the corresponding mixture fraction definition is, according to Eq. (3.12):
Z −0
z = H (3.101)
H 2Y0 W /W −0
H2 H H2
For the O element, a passive scalar is:
(cid:18) (cid:19)
2Y Y Y Y 2Y 2Y
Z =W O2 + O + H2O + OH + HO2 + H2O2 (3.102)
O O W W W W W W
O2 O H2O OH HO2 H2O2
The corresponding mixture fraction is then:
Z −2Y0 W /W
z = O O2 O O2 (3.103)
O 0−2Y0 W /W
O2 O O2
As expected, mixture fractions z and z are equal (Fig. 3.23). The scalar z defined by
O H 1
Eq. (3.15), however, is not equal to z showing that z is not a mixture fraction anymore.
H 1
Thisismainlyduetotheexistenceofadditionalradicalsinthemixture. Fig.3.24displaysthe
flame structure versus valid mixture fractions (such as z or z ): hydrogen and oxygen fuel
O H
massfractionsroughlyfollowtheidealflamestructurebutoverlapintheflameregion,because
of finite rate chemistry and reversibility effects. Moreover, the oxygen mass fraction deviates
from the ideal line even outside the reaction zone (this is due to non equal Lewis numbers
effects). Finally, Fig. 3.25 shows temperature profiles plotted versus z . Three computations
H
are presented:
• the full one-dimensional computation obtained with complete chemistry (Fig. 3.22) and
an exact model for molecular transport (Lewis numbers are not supposed to be unity)

## 페이지 134
3.6. REAL LAMINAR DIFFUSION FLAMES 121
0.20
0.15
0.10
0.05
0.00
sralacs
dezilamroN
Scalar defined on O element (zO)
Scalar defined on O2 and H2 (z1)
0.00 0.05 0.10 0.15 0.20
Mixture fraction defined on H element (zH)
Figure 3.23: Variations of a scalar z (Eq. 3.99) based on fuel and oxidizer mass fractions and of a
1
scalar z (Eq. 3.103) based on the oxygen element versus mixture fraction z (Eq. 3.101) in the H
O H 2
- O diffusion flame displayed on Fig. 3.22.
2
1.0
0.8
0.6
0.4
0.2
0.0
snoitcarf
ssaM
Real Hydrogen
Real Oxygen
Ideal flame structure Hydrogen
Ideal flame structure Oxygen
0.00 0.05 0.10 0.15 0.20 0.25 0.30 0.35
Mixture fraction
Figure 3.24: Fuel and oxygen mass fractions versus mixture fraction z (or z ) in the H - O
H O 2 2
diffusionflamedisplayedonFig.3.22comparedwiththeidealflamestructuredescribedinSection3.2
(dotted lines).

## 페이지 135
122 CHAPTER 3. LAMINAR DIFFUSION FLAMES
• an equilibrium computation (see § 3.3.2) for a single irreversible reaction. To use this
technique, all Lewis numbers must be supposed equal to unity. For such a flame the
variations of the heat capacity C (going from pure hydrogen to pure oxygen) are so
p
large that the ideal flame temperature given by Eq. (3.34) makes no sense. But a local
variable C value given by C = z C + (1 − z )C can be used to account
p p H p,H2 H p,O2
for the variations of C and C with temperature. Although the shape of the
p,H2 p,O2
result is correct, the predicted temperature levels are wrong because dissociations at
high temperature are not captured using a single reaction,
• anequilibriumcomputation(withunityLewisnumbers)usingthefullchemicalscheme.
The assumptions associated with each method are summarized in Table 3.7. The flame
computation (numbered 1) corresponds to the exact solution (if the chemical scheme is cor-
rect); thesecondtechnique(numbered2)assumes thattheequilibriumtechniquecanbe used
(all Lewis numbers are unity) and that a single-step reaction is sufficient to obtain the fi-
nal flame state (no dissociation is taking place in burnt gases) and the third computation
(numbered 3 in Table 3.7 and in Fig. 3.25) uses an equilibrium assumption but computes this
equilibrium using the full chemical scheme so that dissociations are accounted for. Obviously,
method 2 fails to capture the temperature profile: dissociations at high temperature are very
important for such high-temperature flames and cannot be neglected. On the other hand,
method 3 captures the temperature profile because dissociations are accounted for. However,
the slight shift observed between methods 1 and 3 indicates that the equilibrium assumption
is not fully satisfied here: this is mainly due to the high diffusivity of H and H atoms which
2
make the assumption of equal unity Lewis numbers very approximate in such flames. For
hydrocarbon/air flames at lower temperatures, the three techniques would give much closer
results.
Method Description Limitations
1D flame Full transport for all species
1 None (exact solution)
computation and full chemistry
equilibrium Lewis = 1 for all species No dissociation
2
assumption and single step chemistry and approximate transport
equilibrium Lewis = 1 for all species
3 Approximate transport
assumption and complex chemistry
Table 3.7: ComparisonofthreemethodstocomputetemperatureinaH -O diffusionflame(strain
2 2
rate = 300 s−1): (1) one-dimensional flame computation with full chemistry (2) equilibrium with
single step chemistry and (3) equilibrium with full chemistry .
As for premixed flames (§ 2.3.2), sensitivity tools are also available for diffusion flames.
Fig. 3.26 shows the sensitivity of the maximum flame temperature reached in a H /air flame
2
to the diffusion coefficients of the main species (measured by their Lewis number). Hydrogen
diffusionappearstoberesponsibleofthedominanteffectinsuchflames(PitschandPeters407).

## 페이지 136
3.6. REAL LAMINAR DIFFUSION FLAMES 123
4000
3000
2000
1000
)K(
erutarepmeT
Method 1: 1D flame (full chemistry and transport) a = 300 s -1
Method 2: Equilibrium calculation (with single step reaction)
Method 3: Equilibrium calculation (with full chemistry)
0.0 0.2 0.4 0.6 0.8 1.0
Mixture fraction (z)
H
Figure 3.25: Variations of temperature versus mixture fraction z in the H - O diffusion flame
H 2 2
displayed on Fig. 3.22. Methods are summarized in Table 3.7.
5
0
-5
-10
-15
-20
N O H OH O H H O HO H O
2 2 2 2 2 2 2
]%[
.ffeoC
.sneS
.pmeT
.xaM
p = 1 bar
a¥ = 100 s-1
T = T = 300 K
F Ox
Lewis Number
Figure 3.26: Sensitivity of maximum flame temperature in a H /air flame to Lewis numbers
2
(Reprinted by permission of Elsevier Science from Pitsch and Peters407 (cid:13)c the Combustion Insti-
tute).

## 페이지 138
Chapter 4
Introduction to turbulent
combustion
4.1 Interaction between flames and turbulence
When flows entering a flame front are turbulent, the laminar flame mode studied in previ-
ous chapters is replaced by a regime where turbulence and combustion interact. Turbulent
combustion is encountered in most practical combustion systems such as rockets, internal
combustion or aircraft engines, industrial burners and furnaces...while laminar combustion
applications are almost limited to candles, lighters and some domestic furnaces. Studying
and modeling turbulent combustion processes is therefore an important issue to develop and
improve practical systems (i.e. to increase efficiency and reduce fuel consumption and pollu-
tant formation). As combustion processes are difficult to handle using analytical techniques,
numerical combustion for turbulent flames is a fast growing area. But numerical simulations
of turbulent reacting flows remain complex:
• Combustion, even without turbulence, is an intrinsically complex process involving a
large range of chemical time and length scales. Some of the chemical phenomena con-
trolling flames take place in short times over thin layersi and are associated with very
large mass fractions, temperature and density gradients. The full description of chem-
ical mechanisms in laminar flames may require hundreds of species and thousands of
reactions leading to considerable numerical difficulties (Chapt. 2).
• Turbulence itself is probably the most complex phenomenon in non-reacting fluid me-
chanics. Various time and length scales are involved and the structure and the descrip-
tion of turbulence remain open questions. The literature on this topic is enormous and
iChemicaltimescalesdependonconsideredreactions. Inmostpracticalcombustiondevices,fueloxidation
timesareshort. Ontheotherhand,carbonmonoxide(CO)oxidationtocarbondioxide(CO2)isslowerand
formationtimesofthermalnitrogenoxides(NOx)areevenlonger.
125

## 페이지 139
126 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
probably proportional to the difficulty of the task.
• Turbulentcombustionresultsfromthetwo-wayinteractionofchemistryandturbulence.
When a flame interacts with a turbulent flow, turbulence is modified by combustion
becauseofthestrongflowaccelerationsthroughtheflamefrontinducedbyheatrelease,
and because of the large changes in kinematic viscosity associated with temperature
changes. Thismechanismmaygenerateturbulence,called“flame-generatedturbulence”
or damp it (relaminarization due to combustion). On the other hand, turbulence alters
theflamestructure,whichmayenhancethechemicalreactionbutalso,inextremecases,
completely inhibit it, leading to flame quenching.
The objective of this chapter is to introduce basic notions about turbulent combustion
which apply to all regimes (premixed, non-premixed, partially premixed). First, elementary
concepts about turbulence are briefly recalled (§ 4.2). Qualitative experimental results, evi-
dencingtheinfluenceofturbulentmotionsoncombustionarethendescribed(§4.3). Thethree
main numerical approaches used in turbulence combustion modeling are presented (§ 4.4).
ReynoldsaveragedNavierStokes(RANS)equationsdescribemeanflowfieldsandareadapted
to practical industrial simulations (§ 4.5). In direct numerical simulations (DNS), all charac-
teristiclengthandtimescalesareresolvedbutthisapproachislimitedtoacademicsituations
(§ 4.6). In large eddy simulations (LES), larger scales are explicitly computed whereas the
effects of smaller ones are modeled (§ 4.7). In this chapter, balance equations are presented
and advantages and limitations of each approach are discussed. More refined descriptions
andmodels are developedinChapter5forturbulentpremixedflames (reactants are perfectly
mixedbeforeenteringthecombustionchamber)andinChapter6fornon-premixedsituations
(reactants are separately introduced into the chamber). This chapter ends with a brief sum-
maryaboutthepracticalincorporationofcomplexchemistryfeaturesinturbulentcombustion
descriptions (§ 4.8).
4.2 Elementary descriptions of turbulence
This section describes some basic concepts of turbulence relevant to understand turbulent
combustion approaches. Most results are given without any proof but the reader will find
more information in textbooks such as Hinze226, Lesieur301, Piquet406, Pope431.
Turbulence may be characterized by fluctuations of all local properties and occurs for
sufficiently large Reynolds numbers, depending on the system geometry. Any property f is

## 페이지 140
4.2. ELEMENTARY DESCRIPTIONS OF TURBULENCE 127
usually split into mean (f) and fluctuating (f0) contributions:ii
f =f +f0 (4.2)
The turbulence strength is generally characterized by the turbulence intensity I which is
the ratio between the root mean square of the fluctuations f0 and the mean value f:
q
I = f02/f (4.3)
In some situations, the local value f may be replaced by a relevant reference mean value f .
0
Forexample,inboundarylayers,theturbulenceintensityisusuallydeterminedastheratioof
velocityfluctuationsdividedbythemeanfreestreamvelocity. Typicalvaluesoftheturbulence
intensity I go from 0 (in a laminar flow) to tens of percent in typical wall-bounded flows: the
local velocity in a turbulent flow may deviate from its mean value by tens of percent.
Nevertheless, turbulence intensity is not a sufficient parameter to describe turbulent com-
bustion. An important issue is how the turbulence energy is distributed over the different
length scales present in the flow field and which length scales carry enough energy to interact
with the flame front. Turbulent fluctuations are associated with different scales ranging from
the largest, the integral length scale l , to the smallest one, the Kolmogorov length scale η .
t k
The integral scale is usually close to the characteristic size of the flow. For example, in a
ducted flow, the integral scale is of the order of the duct size. A Reynolds number Re(r) is
introduced for each turbulent scale as:
u0(r)r
Re(r)= (4.4)
ν
where u0(r) is the characteristic velocity of the motion of size r and ν is the flow kinematic
viscosity.iii When r corresponds to the integral scale l , the corresponding Reynolds number
t
is the integral Reynolds number:
Re =Re(l )=u0l /ν (4.5)
t t t
which is usually high (100 to 2000 in most combustion devices). Since the Reynolds number
representstheratioofinertiatoviscousforces,thelargestscalesinaturbulentflowaremainly
controlled by inertia and are not affected by viscous dissipation.
iiThis averaging process is usually defined as an ensemble average (i.e. average of a large number of
realizations at the same instant of the same flow field). For steady mean flow fields, this average is replaced
bytimeaveragesoverasufficientlylongperiodt,accordingto:
Z t
1
f = f(t0)dt0 (4.1)
t
0
Thislastsituationisimplicitlyassumedhere.
iiiThisrelation,usualforhomogeneousandisotropicturbulence,assumesthatthevelocityu0(r)associated
to a motion of size r is only function of r. More refined formulations, based on fractal theories are available
(MeneveauandSreenivasan350).

## 페이지 141
128 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
For homogeneous isotropic turbulence (Hinze226), the energy of the large scales flows to
the smaller scales through the Kolmogorov cascade (Kolmogorov281). The energy flux from
one scale to another (due to non-linear terms u u ) is constant along scales and is given by
i j
the dissipation ε of the kinetic energy k. This dissipation ε is estimated as the ratio of the
kinetic energy, u02(r) divided by the time scale r/u0(r):
u02(r) u0(r)3
ε= = (4.6)
r/u0(r) r
Along the cascade, the Reynolds number Re(r) goes down from Re to values close to unity,
t
whereinertiaandviscousforcesbalance. Thislimitdeterminesthesmallestscalefoundinthe
turbulent flow, the Kolmogorov scale η , controlled by viscosity and by the dissipation rate ε
k
of the turbulent kinetic energy k (Kolmogorov281):
η = (cid:0) ν3/ε (cid:1)1/4 (4.7)
k
corresponding to a unity Reynolds number:
u0η ε1/3η4/3
Re =Re(η )= k k = k =1 (4.8)
k k ν ν
The ratio of the integral length scale, l , to the Kolmogorov length scale, η , comparing
t k
the largest and smallest turbulence eddies, is then expressed from (4.5), (4.6) and (4.7):
l u03/ε
t = =Re 3/4 (4.9)
η
k
(ν3/ε)1/4 t
As with laminar flames (§ 2.6), flame strain is an important quantity for turbulent com-
bustion. It measures the fractional rate of increase of the flame front area. Eq. (2.89) shows
that strain is directly linked to velocity gradients: to first order, the strain κ(r) induced on a
flame front by an eddy of size r may be assumed to scale with u0(r)/r which is the simplest
estimate for the velocity gradients created by this eddy. Then:
κ(r)=u0(r)/r = (cid:0) ε/r2(cid:1)1/3 (4.10)
In the same way, the characteristic time scale of an eddy of size r is:
τ (r)=r/u0(r)= (cid:0) r2/ε (cid:1)1/3 =1/κ(r) (4.11)
m
The Kolmogorov (η ) and integral (l ) length scales induce strain values given by:
k t
r
ε ε ε
κ(η )= ; κ(l )= ≈ (4.12)
k ν t u02 k

## 페이지 142
4.2. ELEMENTARY DESCRIPTIONS OF TURBULENCE 129
where u02 measures the turbulent kinetic energy k. Although the scales close to the Kol-
mogorovlengthhavethesmallestsizesandvelocities, theygeneratethehigheststretchiv and:
r
κ(η k ) = l t u0 = p Re (4.13)
κ(l ) ν t
t
(a) Speeds (b) Reynolds numbers
ru’(r)/n
u’(r)
u’lt/n
3
4
3
u’
1
u’K 1 r
h K lt r h K lt
(c) Characteristic times (d) Strains
u’(r)/r
u’K/h
K
r/u’(r)
lt/u’ 3
3
2
2
u’/lt
h K/u’K r
h K lt r h K lt
Figure 4.1: Eddyspeeds(a),Reynoldsnumbers(b),characteristictimescales(c)andstrains(d)as
a function of size r in a log-log diagram.
Figure 4.1 displays the velocity u0(r), the Reynolds number Re(r), the characteristic time
r/u0(r) and strain κ(r)=u0(r)/r as a function of the scale r in a log-log diagram.
In the previous description, turbulence is supposed to behave like isotropic homogenous
turbulence at each point of the reacting flow: obviously, this assumption is not true in real
systems but corresponds to the best available universal description.
ivKolmogoroveddiesalsohavetheshortestlifetimesr/u0(r)whichleadstosomecontroversiesabouttheir
actualeffectonaflamefront(see§5.2.3).

## 페이지 143
130 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
4.3 Influence of turbulence on combustion
The main effect of turbulence on combustion is to increase the combustion rate, as shown in
this section recalling two well-known experimental results, first for a premixed flame (§ 4.3.1)
and second for a jet diffusion flame (§ 4.3.2).
4.3.1 One-dimensional turbulent premixed flame
Consider a statistically one-dimensional premixed flame propagating in a turbulent flow field
(Fig. 4.2).
Turbulent fresh gases Burnt gases
s Turbulent flame brush:
T speed sT
thickness d T
Figure 4.2: Statistically one-dimensional premixed flame propagating in a turbulent flow field.
In this situation, the “mean” flame brush is a planar flame, moving relatively to the
flow field with a turbulent displacement speed s .v Experimentalists have known for a long
T
time that changing the turbulence level before starting combustion in a vessel may change
the time needed for total combustion and, accordingly the turbulent flame speed. In his
book, Laffitte286 presents combustion times measured in a stirred vessel in 1918 (Wheeler550,
Wheeler551)showingthatthecombustionrateismaximum(thecombustiontimeisminimum)
when the reactants are mixed in stoichiometric proportions and increases when the flow be-
comes turbulent (Fig. 4.3). At that time, Laffitte286 noted that “the turbulent flame speed
was always larger than two times the laminar flame speed.” The factor of two observed by
Wheelerisnotgenericofallturbulentflamesandmoreprecisemeasurementsleadtoempirical
vThe turbulent flame speed sT is qualitatively introduced here as a measure of the overall reaction rate
andispreciselydefinedinChapter5.

## 페이지 144
4.3. INFLUENCE OF TURBULENCE ON COMBUSTION 131
relations such as Abdel-Gayed et al.3 and Gulder198:
s u0
T ≈1+ (4.14)
s s
L L
where u0 is the rms (root mean square) of the velocity fluctuations (or the square root of the
turbulent kinetic energy k). This approximate expression shows that premixed combustion is
enhanced by turbulent motions. For large values of the velocity fluctuations, the turbulent
flame speed s becomes roughly independent of the laminar flame speed s (s ≈ u0). Ex-
T L T
periments also show that the mean turbulent flame brush thickness δ is always larger than
T
the laminar flame thickness δ0.
L
Figure4.3: Thecombustiontime(thetimeneededtoreachthemaximumpressureinaclosedvessel)
foramethane/airflamewithandwithoutturbulence,plottedasafunctionoftheproportionofCH in
4
thereactantmixture,correspondingtotheequivalenceratioφ(stoichiometricproportionscorrespond
to about 10 % of methane). Time units correspond to 10−2 seconds (Wheeler550, Laffitte286).
4.3.2 Turbulent jet diffusion flame
In this configuration (Fig. 4.4), a jet of fuel (usually pure) is injected into ambient air. The
flamelengthL canbemeasuredandtheresultsqualitativelydisplayedinFig.4.5asafunction
f
of the Reynolds number Re=Ud/ν where U, d and ν are respectively the initial velocity, the
diameter and the kinematic viscosity of the fuel jet stream (Hottel and Hawthorne230).
TheflamelengthL isfoundtofirstlinearlyincreasewiththefuelflowrateortheReynolds
f
numberR . ForasufficientlyhighReynoldsnumber,theflowbecomesturbulentandtheflame
e
length L decreases before reaching a constant value independent on the Reynolds number
f
R . The transition point between laminar and turbulent region of the flame moves closer to
e

## 페이지 145
132 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
Ambiant air
d U
fuel Flame
Lf
Figure 4.4: Jet flame configuration.
Figure4.5: LengthL ofajetflame(Fig. 4.4)asafunctionofthejetReynoldsnumberR =(Ud/ν).
f e
Figure adapted from Hottel and Hawthorne230.
the injector lip. For sufficiently high injection velocities, the flame is lifted from the burner
(“lifted flame”) and then may be extinguished by “blow-off.”
Since the flame length L remains constant when the Reynolds number (or the injection
f
velocity, corresponding to the fuel mass flow rate) increases, the reaction rate per unit vol-
ume must be enhanced by turbulence: combustion becomes more efficient when turbulence
increases, at least up to the occurrence of lift-off and blow-off phenomena.
4.4 Computational approaches for turbulent combustion
The description of turbulent combustion processes using Computational Fluid Dynamics
(CFD) may be achieved using three levels of computations:
• Reynolds Averaged Navier Stokes (or RANS) computations have historically been the
first possible approach because the computation of the instantaneous flow field in a
turbulent flame was impossible. Therefore, RANS techniques were developed to solve
for the mean values of all quantities. The balance equations for Reynolds or Favre (i.e.
mass-weighted)averagedquantitiesareobtainedbyaveragingtheinstantaneousbalance

## 페이지 146
4.4. COMPUTATIONAL APPROACHES FOR TURBULENT COMBUSTION 133
Figure 4.6: TimeevolutionsoflocaltemperaturecomputedwithDNS,RANSorLESinaturbulent
flame brush.
equations. The averaged equations require closure rules: a turbulence model to deal
with the flow dynamics in combination with a turbulent combustion model to describe
chemical species conversion and heat release. Solving these equations provide averaged
quantitiescorrespondingtoaveragesovertimeforstationarymeanflowsoraveragesover
different realizations (or cycles) for periodic flows like those found in piston engines (i.e.
phase averaging). For a stabilized flame, the temperature predicted with RANS at a
givenpointisaconstantcorrespondingtothemeantemperatureatthispoint(Fig.4.6).
• Thesecondlevelcorrespondstolargeeddysimulations(LES).Theturbulentlargescales
are explicitly calculated whereas the effects of smaller ones are modeled using subgrid
closure rules. The balance equations for large eddy simulations are obtained by filtering
theinstantaneousbalanceequations(§4.7.1). LESdeterminetheinstantaneousposition
of a “large scale” resolved flame front but a subgrid model is still required to take into
account the effects of small turbulent scales on combustion. LES would capture the
low-frequency variations of temperature (Fig. 4.6).
• The third level of combustion simulations is direct numerical simulations (DNS) where
the full instantaneous Navier-Stokes equations are solved without any model for turbu-
lent motions: all turbulence scales are explicitly determined and their effects on com-
bustion are captured. DNS would predict all time variations of temperature (Fig. 4.6)
exactly like a high-resolution sensor would measure them in an experiment. Developed
in the last twenty years thanks to the development of high performance computers,
DNS have changed the analysis of turbulent combustion but are still limited to simple
academic flows (typically, combustion in a small cubic box).
RANS, LES and DNS properties are summarized in terms of energy spectrum in Fig. 4.7.
All spatial frequencies in the spectrum are resolved in direct numerical simulations, whereas
only the largest ones (up to a cut-off wave number k ) are computed in LES (the effects of
c
motions smaller that the cut-off length scale, having a wave number k larger than k , are
c

## 페이지 147
134 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
Modeled in RANS
E(k)
Computed in DNS
Computed in LES Modeled in LES
kc k
Figure 4.7: Turbulence energy spectrum plotted as a function of wave numbers. RANS, LES and
DNSaresummarizedintermsofspatialfrequencyrange. k isthecut-offwavenumberusedinLES
c
(log-log diagram).
modeled). In RANS, only mean flow fields are resolved: no turbulent motion is explicitely
captured.
In terms of computational requirements, CFD for non-reacting and reacting flows follow
similar trends: DNS is the most demanding method and is limited to fairly low Reynolds
numbers and simplified geometries. LES works with coarser grids (only larger scales have to
beresolved)andmaybeusedtodealwithhigherReynoldsnumbersbutrequiresubgridscale
models. Thecomputationqualityandtheresultsaccuracyaredirectlylinkedtothesephysical
subgrid models. In current engineering practice, RANS is extensively used because it is less
demanding in terms of resources but its validity is limited by the closure models describing
turbulence and combustion.
DNSmethodsarelimitedintermsofparameterrangeandgeometrytoacademicsituations.
Forexample,aDNSsimulationofathree-dimensionalturbulentflameatatmosphericpressure
typically requires 1 to 2 million grid points and the computational box corresponds to a
physical size of 5 × 5 × 5 mm3. Fig. 4.8 shows an example of DNS result corresponding to
an instantaneous realization of a premixed flame front interacting with isotropic turbulence
(Trouv´e and Poinsot511, Boger et al.47, Boughanem and Trouv´e53).
The advantage of RANS is its applicability to any configuration and operating conditions:
a standard RANS mesh can contain 105 points and the domain of calculation may be as large
as needed. For example Fig. 4.9a shows an isosurface of mean high temperature (1100 K)
in a turbulent premixed flame stabilized by swirl (see § 6.2.3) obtained with RANS. The
configuration corresponds to a 1:1 burner of a large-scale industrial gas turbine (Selle et
al.475). On the isosurface, the average temperature is 1100 K but RANS does not explicitely
solve for possible turbulent fluctuations around this mean value.

## 페이지 148
4.4. COMPUTATIONAL APPROACHES FOR TURBULENT COMBUSTION 135
Figure4.8: DNSofapremixedflameinteractingwiththree-dimensionalisotropicturbulence(Boger
et al.47). An isosurface of temperature is visualized. The reaction rate is presented in two planes
which are normal to the mean flame front. The vorticity field, corresponding to turbulent motions,
is also displayed in the bottom plane.
(a) RANS result (b) LES result
Figure 4.9: Isosurfaceoftemperature(1100K)duringturbulentcombustioninaswirledcombustor
(see geometry in § 10.3, Selle474). (a): RANS (mean field), (b): LES (instantaneous field).

## 페이지 149
136 CHAPTER 4. INTRODUCTION TO TURBULENT COMBUSTION
WhydosimilarproblemstreatedwithDNSandRANSrequiresodifferentgridsizes(∆x’
10 to 50 microns for DNS and 1 to 5 mm for RANS)? DNS has to describe the smallest scales
contained in the flow field and to resolve the inner instantaneous structure of the flame front
(Fig. 4.8). In many cases this last condition determines the grid size as shown in § 2.4.4. For
hydrocarbon/air flames at atmospheric pressure, fronts have a thickness of the order of 0.1
mm so that mesh sizes of the order of microns are required. In contrast, RANS considers an
averageflamefrontwhichextendsoverabroaderregion: onlymeanturbulencecharacteristics
and average statistical position of the front are solved for, as shown in Fig. 4.10a. As a
consequence the stiffness associated with the chemistry of the flame front is avoided. Typical
mean flame brushes in burners (Abdal-Masseh et al.1), aircraft or piston engine (Boudier et
al.52, Cant and Bray84) have a thickness of 1 to 2 cm and may be easily resolved with a 2
mm mesh. Engineering codes using RANS techniques (the majority of current computational
tools) never resolve the inner structure of the flame and provide average flowfields featuring
scales which are much larger than the instantaneous flame thickness.
Large-eddy simulations are an intermediate tool between DNS and RANS. LES methods
havebeenusedextensivelyinmanynonreactingflowsandhaveprovidedreliablepredictionsin
avarietyofapplications(seeforexampleHerringetal.216, MoinandKim361 orAkselvolland
Moin5). The treatment of reacting flows with similar concepts is less well established. While
some advances have been made (Kerstein et al.270, Givi191, Kailasanath et al.249, Gao177,
Givi192, Menonetal.352, VeynanteandPoinsot535, Angelbergeretal.11, Bogeretal.47, Pierce
andMoin403,Selleetal.475)researchisstillrequiredonthistopic. Itisinparticularnecessary
toconstructmethodsforthecalculationofthe“largescale”flamefrontandtodevelopsubgrid
scale models. Fig. 4.9b gives an example of instantaneous LES field (Selle474) in the same
geometryastheRANSresult(Fig.4.9a). Obviously,theinstantaneousflamesurfaceobtained
with LES contains much more turbulent scales than the averaged field given by the RANS
code.
The velocity fields obtained by RANS or LES also illustrate the basic differences between
the two approaches (Fig. 4.10). While the field of axial velocity obtained with RANS is very
smooth(Fig.4.10a),theLESfieldexhibitsmuchmoreunsteadystructures: intermsofphysics,
the LES captures more turbulent activity; in terms of numerical resolution, the grid required
for RANS can be very coarse because gradients are small. On the other hand, for LES, the
grid must be fine and the numerical method non dissipative in order to capture the small
motions evidenced in Fig. 4.10b. Considering also that RANS codes compute only one state
(the converged flow) while LES codes must resolve the flow in time, the cost of a typical LES
computation is often 100 to 1000 times higher than a RANS computation. However, despite
its cost, LES is well adapted for many combustion studies (see examples in Chapter 10):
• Largestructuresinturbulentflowsdependonthesystemgeometrywhereassmallstruc-
tures are generally assumed to have more universal features. Accordingly, models are
probably more suited to describe these small structures.
• Mostreactingflowsexhibitlargescalecoherentstructures(Coats109).Suchstructuresare
also observed when combustion instabilities occur. These instabilities are due to a cou-

## 페이지 150
4.4. COMPUTATIONAL APPROACHES FOR TURBULENT COMBUSTION 137
(a) RANS result (b) LES result
Figure 4.10: Axialvelocityfieldsduringturbulentcombustioninaswirledcombustor(seegeometry
in § 10.3). (a): RANS (mean field), (b): LES (instantaneous field). The zones within the black line
are backflow regions (A. Giauque, private communication).
pling between heat release, hydrodynamic flow field and acoustic waves (see Chapt. 8).
Theyhavetobeavoidedbecausetheyinducenoise,variationsofthesystemcharacteris-
tics,largeheattransfersandmayleadtothesystemdestruction. LESisapowerfultool
to predict the occurrence of such instabilities and to numerically test passive or active
control systems.
• The knowledge of large-scale turbulent motions may be used to infer the effects of the
unresolved smaller ones: for example, during the Kolmogorov cascade, the energy flows
from large (resolved) structures to (unresolved) smaller scales. In fact, subgrid scale
models are generally based on similarity assumptions between large and small scales.
• Large eddy simulations also allow a better description of the turbulence/combustion
interactions. As large structures are explicitly computed in LES, instantaneous fresh
and burnt gases zones, where turbulence characteristics are quite different (see § 5.1.3
and Fig. 5.11), are clearly identified, at least at the resolved level (see, for example,
Fig. 4.10b). This is a significant advantage of LES compared to RANS in which models
have to take into account (at a given spatial location) the probability of being in fresh
or in burnt gases.
Comparisons between RANS, LES and DNS are briefly summarized in Table 4.1.
The previous analysis may also be illustrated from experimental data. This point is of
importance as such data are required to validate numerical simulations. In Fig. 4.11a, a
planarlaserinducedfluorescence(PLIF)imagingoftheOH radicalisdisplayedinaturbulent


> ⚠️  전체 535 페이지 중 150 페이지만 추출됨 (--max-pages 제한)
