# Eigenvalues and Eigenvectors of the euler equations in general geometries

> 원본: `numerical-analysis/Eigenvalues and Eigenvectors of the euler equations in general geometries.pdf` (0.1MB, 6 페이지 추출)

## 페이지 1
AIAA 2001-2609
EIGENVALUES AND EIGENVECTORS OF THE EULER
EQUATIONS IN GENERAL GEOMETRIES
AXEL ROHDE *
Florida Institute of Technology
Melbourne, Florida 32901
ABSTRACT
where,
The complete eigensystem, including eigenvalues and
left and right eigenvectors, of the Euler equations of
inviscid flow are derived in a general finite volume  ρ   ρv 
   n 
coordinate frame. The symmetry of the eigenvector ρu ρuv +pn
space is demonstrated from a mathematical and (cid:75)   (cid:75)  n x
Q = ρv , F = ρvv +pn  (2)
geometric viewpoint. Results are presented for 2-D and    n y
3-D inviscid flow, and their application in compu- 
ρw

ρwv +pn

n z
tational fluid dynamics (CFD) is discussed.  ρe     ρh v  
o o n
The velocity across a cell boundary is simply defined as
INTRODUCTION
the dot product of local velocity vector and outward
The eigensystem—eigenvalues and eigenvectors—of unit normal vector to the boundary,
the Euler equations of inviscid flow form the basis of
(cid:71)
total variation diminishing (TVD) algorithms in v =v⋅nˆ = un +vn +wn
computational fluid dynamics (CFD).1-5 Whether the n x y z
(3)
conservation equations are solved in a finite difference
n2+n2+n2 =1
or finite volume format, the matrices of right and left x y z
eigenvectors that can be found in the literature are
generally decomposed along the directions of a global The stagnation energy and enthalpy per unit mass are
(x,y,z) or local (ξ,η,ζ) coordinate system.6-9 Such the sum of static and dynamic parts, respectively,
matrix decomposition, however, is not necessary. The
eigenvalues and eigenvector matrix of 3-D inviscid e = e+e , h = h+e
o k o k
flow can be expressed along any given direction, e.g. (4)
through a unit vector (n ,n ,n ) normal to a surface. ( )
x y z e = 1 u2+v2+w2
The resulting expression is relatively simple and allows k 2
for more efficient code implementation in finite volume
TVD flow solvers. with e being the kinetic energy per unit mass. Static
k
energy, enthalpy, and pressure can all be expressed in
terms of the local speed of sound a, a function of
GOVERNING EQUATIONS temperature, and the ratio of specific heats γ,
The 3-D unsteady Euler equations of inviscid flow, a
system of integral conservation equations for mass, e =
a2
, h =
a2
, p =
ρa2
momentum, and energy, can be written in vector γ(γ−1 ) γ−1 γ
notation as the sum of a volume and surface integral, (5)
where,
∂ (cid:75) (cid:75)
∫ QdV + (cid:118)∫ FdA = 0 (1) a2 = γRT , γ=c c
∂t p v
CV CS
*
Ph.D. Graduate, Aerospace Engineering Program, Mechanical and Aerospace Engineering Department. Student Member AIAA.
Copyright © 1999-2001 Axel Rohde. Published by the American Institute of Aeronautics and Astronautics Inc. with permission.
1
American Institute of Aeronautics and Astronautics

## 페이지 2
AIAA 2001-2609
TRANSFORMATION MATRIX vector components F with respect to the flow vector
i
The first step in determining the eigensystem of the components Q after expressing the flux vector solely
j
above conservation equations is to derive the
in terms of the flow vector. Only the resulting
corresponding Jacobian or transformation matrix, which
transformation matrix shall be presented here,
can be found by taking partial derivatives of the flux
 0 n n n 0 
(γ−1 ) e n −uv v −(γ− x 2 ) un un −(γ y −1 ) vn un −(γ z −1 ) wn (γ−1 ) n 
[ A ]=
∂F
i =

(γ−1 ) e
k
n
x
−vv
n
vn
n
−(γ−1 ) un
x
v
y
−(γ−2 ) vn
x
vn
z
−(γ−1 ) wn
x
(γ−1 ) n
x
 (6)
∂Q
j

 (γ−1 ) e
k
n
y
−wv
n
wn
x
−(γ−1 ) un
y
wn
n
−(γ−1 ) vn
y
v
z
−(γ−2 ) wn
y
(γ−1 ) n
y

k z n x z y z n z z
    (γ−1 ) e −h  v h n −(γ−1 ) uv h n −(γ−1 ) vv h n −(γ−1 ) wv γv  
k o n o x n o y n o z n n
We can now rewrite the Euler equations in the format EIGENVALUES AND RIGHT EIGENVECTORS
of a general wave equation,
The eigenvalues of the transformation matrix [A] are
the rootsλof the characteristic equation,
∂ (cid:75) (cid:75) (cid:75) i
∫ QdV + (cid:118)∫ F(Q)dA = 0 (7)
∂t
CV CS det ( [A]−λ[I] ) = 0 (8)
where,
F (cid:75) (Q (cid:75) ) = [ A ] Q (cid:75) where [I] is the identity matrix. It turns out that three
eigenvalues are distinct and two are repeated,
The transformation matrix [A] can be interpreted as a λ = {v −a, v , v +a, v , v } (9)
i n n n n n
wave speed with local and directional dependence for a
nonlinear multi-dimensional wave. The multi- (cid:75)
Each right eigenvectorR , corresponding to eigenvalue
dimensional character is really twofold: (1) we are i
λ, must satisfy the following matrix equation,
working in a 3-D flow field, where waves can travel in i
any direction; (2) there are different types of waves, all (cid:75) (cid:75)
traveling at their own characteristic speeds, which are [ A ] R =λR (10)
i i i
determined by the eigenvalues of the matrix [A].
Being column vectors, the right eigenvectors can be
collectively written in matrix form, such that,
 1 1 1 0 0 
 
u−an u u+an n −n
(cid:75) (cid:75) (cid:75) (cid:75) (cid:75)  x x y z 
(R-1): [ R ] =  R R R R R   = v−an v v+an −n 0  (11)
1 2 3 4 5  y y x 
w−an w w+an 0 n 
z z x
 h −av e h +av un −vn wn −un  
o n k o n y x x z
(cid:75) (cid:75)
It should be noted at this point that the eigenvectors of form a basis—the eigenvectors R and R , which
repeated eigenvalues are not distinct! They span a 4 5
belong to the repeated eigenvalues λ =λ =v , span a
subspace and any vector within this subspace is also an 4 5 n
eigenvector of the same repeated eigenvalue. In the two dimensional subspace. Any linear combination of
(cid:75) (cid:75) (cid:75) (cid:75)
general space (cid:92)5 above—for which R through R R and R is itself a member of that subspace and thus
1 5 4 5
2
American Institute of Aeronautics and Astronautics

## 페이지 3
AIAA 2001-2609
an eigenvector. For example, a sixth eigenvector, which The following sets of right eigenvectors, again written
(cid:75) (cid:75)
would satisfy the equation [ A ] R =λ R , could be in matrix format, are equally valid with (R-1),
6 2 6
formed as follows,
 0 
 
0
(cid:75) −n  (cid:75) −n  (cid:75)  
R =  z R +  y R =  n  (12)
6  n  4  n  5  z 
x x  −n 
y
 vn −wn  
z y
 1 1 1 0 0 
 
u−an u u+an n 0
(cid:75) (cid:75) (cid:75) (cid:75) (cid:75)  x x y 
(R-2): [ R ] =  R R R R R   = v−an v v+an −n n  (13)
1 2 3 4 6  y y x z 
w−an w w+an 0 −n 
z z y
 h −av e h +av un −vn vn −wn  
o n k o n y x z y
 1 1 1 0 0 
 
u−an u u+an −n 0
(cid:75) (cid:75) (cid:75) (cid:75) (cid:75)  x x z 
(R-3): [ R ] =  R R R R R   = v−an v v+an 0 n  (14)
1 2 3 5 6  y y z 
w−an w w+an n −n 
z z x y
 h −av e h +av wn −un vn −wn  
o n k o n x z z y
LEFT EIGENVECTORS
For the first set of right eigenvectors (R-1), the
The set of left eigenvectors can be determined from the
matching set of left eigenvectors written in matrix
inverse of the right eigenvector matrix,
format is,
[L]=[R]−1 (15)
(γ−1 ) e k +av n ( 1−γ) u−an x ( 1−γ) v−an y ( 1−γ) w−an z γ−1 
(cid:76)  2a2 2a2 2a2 2a2 2a2
L 
(cid:76)1  a2−(γ−1 ) e
k
(γ−1 ) u (γ−1 ) v (γ−1 ) w 1−γ 
 L   a2 a2 a2 a2 a2 
(L-1): [ L ] =  L (cid:76)2  = (γ−1 ) e k −av n ( 1−γ) u+an x ( 1−γ) v+an y ( 1−γ) w+an z γ−1  (16)
(cid:76)3  2a2 2a2 2a2 2a2 2a2
 
L (cid:76)4   v−v n n y n n2 y −1 n y n z 0 
L   n x y n x n x 
5  v n n z −w −n −n y n z 1−n z 2 0 
n x z n x n x
Being row vectors, the left eigenvectors are denoted by corresponding eigenvalue satisfy the following matrix
a left pointing half arrow. Each left eigenvector and equation, and thus bear the name “left” eigenvector,
3
American Institute of Aeronautics and Astronautics

## 페이지 4
AIAA 2001-2609
(cid:76) (cid:76)
L [A]=λL (17) emerges. It turns out that the inverse matrix of the
i i i
second and third set of right eigenvectors, (R-2) and (R-
3), yield a similar result, carrying the singularity in the
The above left eigenvector matrix becomes singular for
n and n component, respectively,
n =0, and simply multiplying the last two rows by n y z
x x
does not alleviate the problem; the matrix remains
singular along certain directions, and a zero row vector
(γ−1 ) e k +av n ( 1−γ) u−an x ( 1−γ) v−an y ( 1−γ) w−an z γ−1 
(cid:76)  2a2 2a2 2a2 2a2 2a2
L 
(cid:76)1  a2−(γ−1 ) e
k
(γ−1 ) u (γ−1 ) v (γ−1 ) w 1−γ 

L

 a2 a2 a2 a2 a2 
(L-2): [ L ] =   L (cid:76) (cid:76)2 3   =   (γ−1 ) 2 e a k 2 −av n ( 1−γ 2 ) u a2 +an x ( 1−γ) 2 v a + 2 an y ( 1−γ) 2 w a2 +an z 2 γ− a 1 2   (18)
 


L
L
(cid:76)6 



v n n
n
x
y
−u 1−
n y
n x 2 −n
x
−n
n
x
y
n z 0 

7  w−v n n z n x n z n n z 2−1 0 
n y n y z n y
(γ−1 ) e k +av n ( 1−γ) u−an x ( 1−γ) v−an y ( 1−γ) w−an z γ−1 
(cid:76)  2a2 2a2 2a2 2a2 2a2
L 
(cid:76)1  a2−(γ−1 ) e
k
(γ−1 ) u (γ−1 ) v (γ−1 ) w 1−γ 
 L   a2 a2 a2 a2 a2 
(L-3): [ L ] =  L (cid:76)2  = (γ−1 ) e k −av n ( 1−γ) u+an x ( 1−γ) v+an y ( 1−γ) w+an z γ−1  (19)
(cid:76)3  2a2 2a2 2a2 2a2 2a2
 
L (cid:76)8   u−v n n x n x 2−1 n x n y n 0 
L 

n z n z n z x

9  v n n y −v −n x n y 1−n2 y −n 0 
n z n z n z y
(cid:71)
Depending on the direction of the unit normal vector, a v =v⋅nˆ = un +vn
n x y
singularity in the left eigenvectors can thus be avoided
(20)
by choosing the appropriate matrix. To minimize
n2+n2 =1
numerical error during the computation, the largest x y
component of the normal vector—measured by its
( )
absolute value—should always be located in the e = 1 u2+v2 (21)
k 2
denominator.
The set of eigenvalues reduces to the first four, only
one being repeated,
EIGENSYSTEM FOR 2-D FLOW
The transformation matrix and complete eigensystem λ ={v −a, v , v +a, v } (22)
for 2-dimensional flow can easily be derived from the i n n n n
more general 3-dimensional result by eliminating
Choosing the first set of eigenvectors, both left and
appropriate rows and columns within the matrices and
right, the matrix of right eigenvectors for 2-D flow is
simplifying the remainder by setting w=n =0. For
z obtained after eliminating the fourth row and fifth
example, the transformation matrix [A] for 2-D flow is
column from the general result, whereas the left
obtained after eliminating the fourth row and fourth
eigenvector matrix is found by deleting the fifth row
column, and by redefining some of the quantities
and fourth column from its original 5x5 matrix. It is
involved,
interesting to note that after applying the above 2-D
definitions, the singularities in the last row of the new
4
American Institute of Aeronautics and Astronautics

## 페이지 5
AIAA 2001-2609
4x4 left eigenvector matrix disappear! The first and  0   0 
third element of the fourth row can be simplified to,    
(cid:75) 
−n
z   (cid:71) 
( ) R =  0  =  t  (25)
v−v n v− un +vn n 5    y 
n y = x y y  n   
n x v−un n n x −v ( 1−n2 )  wn x − x un z    v (cid:71) ⋅t (cid:71) y  
= x y x (23)
n
x
= vn −un  0   0 
x y    

0
  
(cid:75) (cid:71)
n2−1 −n2 R =  n  =  t 
y = x = −n (24) 6  z   x 
n n x  −n   
x x  vn −w y n     v (cid:71) ⋅t (cid:71)  
z y x
(cid:75)
DISCUSSION OF RESULTS It was shown earlier that R can be expressed as a
(cid:75) 6 (cid:75)
It was demonstrated earlier that two of the five right linear combination of R and R . Geometrically, this
4 5
eigenvectors form a 2-dimensional subspace, within the
implies that for each normal vector only two tangent
general 5-dimensional space spanned by all right
vectors are needed to define the same plane. Any two
eigenvectors, and that every member of this subspace is
tangent vectors rotated around the unit normal vector nˆ
itself an eigenvector. This phenomenon was attributed
will result in another set of equally valid tangent
to the fact that their corresponding eigenvalues are
vectors defining the same planar surface. The unit
repeated, which creates a “symmetry” within the
normal vector, being the axis of rotation, can thus be
eigenvector space. Although it may seem difficult to
seen as the axis of symmetry for the vector space
visualize any symmetry within a 5-dimensional vector
defined.
space, part of this symmetry reveals itself when we
geometrically interpret the 2-dimensional subspace as a
(cid:75) (cid:75) (cid:75)
plane. The eigenvectors R , R , and R shall now (cid:71) (cid:71) (cid:71)
4 5 6 n(cid:3)⋅t =n(cid:3)⋅t =n(cid:3)⋅t =0
demonstrate this effect. Upon careful observation, they x y z
(cid:71) (cid:71)
can be recast as shown in Equation (25), where t , t
x y
(cid:71) z
and t are tangent vectors which all lie in the plane
z
defined by the unit normal vector n(cid:3); their subscripts
n(cid:3)
denote the vanishing component along the
corresponding major axis, which can clearly be seen in (cid:71) (cid:71)
t t
Figure 1. Although all tangent vectors are depicted with y x
y
equal length, they are not unit vectors and thus carry the
standard vector symbol rather than the caret. Needless (cid:71)
to say, the orthogonality relation holds between the t z
tangent vectors and the surface unit normal, which is
x
restated in Figure 1.
Figure 1: Eigenvector Subspace
 0   0 
   
(cid:75) 
n
y   (cid:71) 
R =  −n  =  t  What has been omitted so far is the physical
4  x   z  interpretation of the eigenvectors themselves. In simple
 0   
  un y −vn x     v (cid:71) ⋅t (cid:71) z   t m er e m nt s i , o n w e h d i c e h a r w lie a r y t d h o a t th th e e e d ig if e f n e v re e n c t t or s s p e p e o d i s n t a ? t I w t h w ic a h s
waves travel through the flow field are determined by
their eigenvalues. The direction of wave travel has
already been specified by the unit vector nˆ normal to
the surface under consideration—recall that we are
5
American Institute of Aeronautics and Astronautics

## 페이지 6
AIAA 2001-2609
trying to determine the magnitude of the mass, 3 Wang, Z., and B.E. Richards. High Resolution
momentum, and energy flux across a given surface Schemes for Steady Flow Computation. Journal of
element. Computational Physics, Volume 97, 1991, pp. 53-72.
The Euler equations contain three types, or families of 4 Smithwick, Quinn, and Scott Eberhardt. Fuzzy
waves, one for every distinct eigenvalue. Each family Controller and Neuron Models of Harten’s Second-
of waves carries a different signal. The waves traveling Order TVD Scheme. AIAA Journal, Volume 32, No.
at the speed of the flow (v ) are called entropy waves, 10, 1994, pp. 2122-2124.
n
their signal being entropy, whereas waves traveling at
the speed of sound relative to the flow (v ±a) are 5 Jeng, Yih Nen, and Uon Jan Payne. An Adaptive TVD
n Limiter. Journal of Computational Physics, Volume
called acoustic waves. Unfortunately, the signal carried
118, 1995, pp. 229-241.
by acoustic waves is not quantifiable in simple
thermodynamic terms, but let us just say that they carry 6 Yee, H.C., and P. Kutler. Application of Second-
acoustic information.
Order-Accurate TVD Schemes to the Euler Equations
in General Geometries. NASA Technical Memo-
In essence, the eigenvectors point along the direction of
randum, TM 85845, 1983.
the strongest signal. Any signal, whether physical or
numerical in nature, is never completely noise free. 7 Wang, J.C.T., and G.F. Widhopf. A High-Resolution
Numerical noise is introduced into the flow field
TVD Finite Volume Scheme for the Euler Equations in
through discretization error, as well as the accumulative
Conservation Form. Journal of Computational Physics,
effect of machine round-off error. However, one can
Volume 84, 1989, pp. 145-173.
minimize the noise and thus obtain the strongest
possible signal through proper tuning. The eigenvectors 8 Lu, Pong-Jeu, and Kuen-Chuan Wu. Assessment of
are optimally tuned with respect to the flow and thus
TVD Schemes in Compressible Mixing Flow
deliver the best signal-to-noise ratio when it comes to
Computations. AIAA Journal, Volume 30, No. 4, 1992,
computing the fluxes across a surface element.
pp. 939-946.
9 Li, X.L., B.X. Jin, and J. Glimm. Numerical Study for
CONCLUSION
the Three-Dimensional Rayleigh-Taylor Instability
The above derivation of the inviscid eigensystem was through the TVD/AC Scheme and Parallel
aided by the analysis software Mathematica from Computation. Journal of Computational Physics,
Wolfram Research, Inc. Although its presentation is by Volume 126, 1996, pp. 343-355.
no means unique, the format adopted here is very
compact and allows for efficient code implementation 10 Rohde, Axel. A Computational Study of Flow Around
within a total variation diminishing (TVD) algorithm as a Rotating Disc in Flight. Dissertation in Aerospace
part of an inviscid or viscous finite volume flow solver. Engineering, Florida Institute of Technology, 2000.
An application of the above result can be found in the Published via the author’s website, www.microcfd.com.
author’s dissertation, which studies the high-altitude
compressible viscous flow over a rotating disc.10
REFERENCES
1 Harten, Ami. High Resolution Schemes for Hyperbolic
Conservation Laws. Journal of Computational Physics,
Volume 49, 1983, pp. 357-393.
2 Yee, H.C., R.F. Warming, and Ami Harten. ”On a
Class of TVD Schemes for Gas Dynamic Calculations”,
Numerical Methods of the Euler Equations of Fluid
Dynamics. Edited by F. Angrand, A. Dervieux, J.A.
Desideri, and R. Glowinski. Society for Industrial and
Applied Mathematics, Philadelphia, PA, 1985, pp. 84-
107.
6
American Institute of Aeronautics and Astronautics
