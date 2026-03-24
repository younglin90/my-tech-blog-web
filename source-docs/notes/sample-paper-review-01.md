# Physics-Informed Neural Networks for Turbulence Modeling in CFD

## Paper Info
- **Authors:** Raissi, M., Perdikaris, P., Karniadakis, G. E.
- **Journal:** Journal of Computational Physics, Vol. 378, 2019
- **DOI:** 10.1016/j.jcp.2018.10.045
- **arXiv:** 1711.10561

## Abstract
We introduce physics-informed neural networks (PINNs) — neural networks that are trained to solve supervised learning tasks while respecting any given laws of physics described by general nonlinear partial differential equations.

## Background
Traditional turbulence models (k-ε, k-ω SST) rely on empirical closure coefficients that may not generalize well across flow configurations. Data-driven approaches using neural networks have shown promise but often violate physical conservation laws.

## Key Method
PINNs embed the governing PDEs (Navier-Stokes equations) directly into the loss function:

$$\mathcal{L} = \mathcal{L}_{data} + \lambda \mathcal{L}_{physics}$$

where the physics loss penalizes residuals of the N-S equations:

$$\mathcal{L}_{physics} = \left\| \frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u} \cdot \nabla)\mathbf{u} + \nabla p - \frac{1}{Re}\nabla^2\mathbf{u} \right\|^2$$

The network simultaneously satisfies boundary/initial conditions and the PDE residual.

## Key Results
- Successfully inferred hidden flow fields from sparse pressure measurements
- Identified Reynolds number from velocity data alone
- 2D cylinder flow: Re=100, accurate vortex shedding frequency recovery
- Lid-driven cavity: Re=1000, velocity profiles match DNS within 1%

## Practical Applicability
- Can be implemented with PyTorch/TensorFlow + automatic differentiation
- Applicable when experimental data is sparse but physics is known
- Limitation: training time is significantly longer than classical solvers (hours vs minutes)
- Not yet competitive with optimized FVM solvers for production CFD

## Limitations
- Scalability to 3D, high-Re turbulent flows remains an open problem
- Stiff PDEs cause training instability
- No uncertainty quantification in standard formulation

## Future Directions
- Extended PINNs (XPINNs) for domain decomposition
- Integration with OpenFOAM as a hybrid solver
- Transfer learning across Reynolds numbers
