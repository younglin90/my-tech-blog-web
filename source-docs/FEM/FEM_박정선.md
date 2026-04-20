# Finite Element Method

Dept. of Aerospace eng. Prof. J. S. Park

Dept. of Aerospace eng. 2000121134 C.J.Yoon Contact: cj5536@hanmail.net Cell Phone: 016-792-5557

## Finite Element Analysis

## Chapter 1. Introduction

#### 1.1 Engineering problem.

Engineering problems are mathematical models of physical situations. Mathematical models are differential equations with a set of corresponding boundary and initial conditions.

이 Differential equation을 Governing equation이라 한다. Analytical solution 에는 homogenous part와 particular part가 있다. 또, particular solution은 finite element modeling을 이해하는데 중요하다.

#### 1.2 Numerical methods.

실제적인 engineering problems에서는 정확한 solution을 얻지 못하는 경우가 많다.

정확한 solution을 얻지 못하는 것은 complex nature of governing differential equation과 boundary, initial condition을 다루는 것이 어렵기 때문이다. 이런 문제를 다루기 위해 numerical approximation을 쓴다.

Numerical method에는 ① finite difference method ② finite element method 두 가지로 분류할 수 있다.

①은 단순한 문제에 적용되고 이해하기 쉽다. 반면에 복잡한 문제에는 적합하지 못하다. 하지만, ②는 복잡한 여러 문제에 적용할 수 있다.

## twite

## 1.3 A Brief history of the element method and ANSYS.

ANSYS는 매우 다양한 engineering 분야에서 사용되고 있지만 finite element method의 이 해 없이 사용한다면 많은 어려움이 따를 것이다.

유한요소법의 역사적 배경

1941년 : 레니코프(Hrenikoff)가 "프레임 구성 방법(frame work method)"을 이용하여 탄성 문제를 구하는 과정을 제시.

1943년 : 쿠란트(Courant)는 자신의 논문에서 여러 개의 삼각 모양으로 나눈 영역에 구분적 보간함수를 이용하여 비틀림 문제를 구성하였다.

1955년 : 아기리스(Argyris)에 의하여 발간된 책자는 에너지법칙과 행렬방법에 대하여 쓰여 졌는데, 이것이 유한요소 연구의 발전에 초석이 되었다.

1956년 : 텃너(Turner)등은 트러스, 보와 같은 구조요소들에 대한 강성행렬을 유도하여 발표

1960년 : 클러프(Clough)에 의해서 유한요소라는 용어가 처음으로 사용.

1967년 : 진키위치(Zienkiwicz)와 츙(Cheung)은 유한요소에 대한 첫 번째 책을 출판.

1972년 : 오덴(Oden)은 비선형 연속체에 대한 책을 저술,

### 1.4 Basic steps in the finite element method.

Preprocessing phase

- 1). Create and discretize the solution domain into finite elements; that is, subdivide the problem into nodes and elements.
- 2). Assume a shape function to represent the physical behavior of an element; that is, an approximate continuous function is assumed to represent the solution of an element.
- 3). Develop equation for an element.
- 4). Assemble the elements to present the entire problem. Construct the global stiffness matrix.
- 5). Apply boundary conditions, initial condition, and loading.

Solution Phase

6). Solve a set of linear or nonlinear algebraic equation simultaneously to obtain nodal results, such as displacement values at different nodes or temperature values it different nodes in a heat transfer problem.

Postprocessing Phase.

- 7). Obtain other important information. At this point, you may be interested in values of principal stresses, heat fluxes, etc.
- 일반적으로, finite element problem의 formulation에는,
- ① Direct Formulation.
- 2 The minimum total potential energy Formulation.
- 3 Weighted residual Formulation.
- 이 있다.

### 1.5 Direct formulation.

Example 1.1 (figure 1.1)

![](_page_3_Picture_2.jpeg)

Preprocessing Phase

① Discretize the solution domain into finite elements.

~ (figure 1.1)을 (figure 1.2) 와 같이 five nodes와 four elements로 나눈다.

② Assume a solution that approximates the behavior of an element.

~(figure 1.3) A solid member of uniform cross section subjected to a fore F.

$$\sigma = \frac{F}{A}$$
 (1.1)
$$\cdot \text{ average normal strain } \qquad \epsilon = \frac{\Delta l}{l}$$
 (1.2)
$$\cdot \text{ Hooke's Law } \qquad \sigma = E \epsilon$$
 (1.3)

식(1.1),(1.2),(1.3)에 의해서

$$F = \left(\frac{AE}{l}\right) \triangle l \tag{1.4}$$

식(1.4) 는 linear spring, F = K x 와 비슷하다.

그러므로, 
$$K_{equient} = \frac{AE}{l}$$
 (1.5)

figure 1.2 of 
$$A_{i+1}$$
 in  $A_{i+1}$  in  $A_{i+1}$  figure  $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}E$   $A_{avg}$ 

$$\Rightarrow K_{eq} = \frac{(A_{i+1} + A_i)E}{2I} \tag{1.7}$$

static equilibrium requires that the sum of the forces acting on each node be zero.

node 1 : 
$$R_1 - K_1(u_2 - u_1) = 0$$

node 2 : 
$$K_1(u_2-u_1)-K_2(u_3-u_2)=0$$

node 3 : 
$$K_2(u_3-u_2)-K_3(u_4-u_3)=0$$

node 4: 
$$K_3(u_4-u_3)-K_4(u_5-u_4)=0$$

node 5 : 
$$K_4(u_5-u_4)-P=0$$

matrix form으로 바꾸면...

$$\begin{bmatrix} k_{1} & -k_{1} & 0 & 0 & 0 \\ -k_{1} & k_{1} + k_{2} & -k_{2} & 0 & 0 \\ 0 & -k_{2} & k_{2} + k_{3} & -k_{3} & 0 \\ 0 & 0 & -k_{3} & k_{3} + k_{4} & -k_{4} \\ 0 & 0 & 0 & -k_{4} & k_{4} \end{bmatrix} \qquad \begin{pmatrix} u_{1} \\ u_{2} \\ u_{3} \\ u_{4} \\ u_{5} \end{pmatrix} = \begin{pmatrix} -R_{1} \\ 0 \\ 0 \\ 0 \\ P \end{pmatrix}$$

$$(1.10)$$

$$\Rightarrow \begin{pmatrix} -R_1 \\ 0 \\ 0 \\ 0 \\ 0 \\ 0 \end{pmatrix} = \begin{pmatrix} k_1 & -k_1 & 0 & 0 & 0 \\ -k_1 & k_1 + k_2 & -k_2 & 0 & 0 \\ 0 & -k_2 & k_2 + k_3 & -k_3 & 0 \\ 0 & 0 & -k_3 & k_3 + k_4 & -k_4 \\ 0 & 0 & 0 & -k_4 & k_4 \end{pmatrix} \begin{pmatrix} u_1 \\ u_2 \\ u_3 \\ u_4 \\ u_5 \end{pmatrix} \begin{pmatrix} 0 \\ 0 \\ 0 \\ 0 \\ P \end{pmatrix}$$

$$(1.11)$$

general form.....

which stands for

(reaction matrix) = [stiffness matrix]{displacement matrix} - {load matrix} - 경제는 Singwar 의 여기서 node 1에서의 변위가 zero 이므로  $u_1 = 0$  이된다.

$$\therefore \begin{bmatrix}
1 & 0 & 0 & 0 & 0 \\
-k_1 & k_1 + k_2 & -k_2 & 0 & 0 \\
0 & -k_2 & k_2 + k_3 & -k_3 & 0 \\
0 & 0 & -k_3 & k_3 + k_4 & -k_4 \\
0 & 0 & 0 & -k_4 & k_4
\end{bmatrix} \begin{bmatrix}\nu_1 \\ u_2 \\ u_3 \\ u_4 \\ u_5
\end{bmatrix} = \begin{bmatrix}
0 \\ 0 \\ 0 \\ 0 \\ P
\end{bmatrix}$$
(1.13)

3 Develop equation for an element.

figure 1.5에서.....

$$f_{i} = k_{eq}(u_{i} - u_{i+1})$$

$$f_{i} = k_{eq}(u_{i} - u_{i+1})$$

$$\Rightarrow \begin{pmatrix} f_{i} \\ f_{i+1} \end{pmatrix} = \begin{pmatrix} k_{eq} - k_{eq} \\ -k_{eq} & k_{eq} \end{pmatrix} \begin{pmatrix} u_{i} \\ u_{i+1} \end{pmatrix}$$

$$(1.15)$$

4 Assemble the elements to present the entire problem.

~ The stiffness matrix for element (1)

$$[K]^{(1)} \doteq \begin{bmatrix} k_1 & -k_1 \\ -k_1 & k_1 \end{bmatrix}$$

global stiffness matrix.....

$$[K]^{(1G)} = \begin{bmatrix} k_1 & -k_1 & 0 & 0 & 0 \\ -k_1 & k & 0 & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 \\ 0 & 0 &$$

각각의 element도 같은 방법으로.....

$$[K]^{(G)} = [K]^{(1G)} + [K]^{(2G)} + [K]^{(3G)} + [K]^{(4G)} + [K]^{(5G)}$$

$$\therefore [K]^{(G)} = \begin{bmatrix}
k_1 & -k_1 & 0 & 0 & 0 \\
-k_1 & k_1 + k_2 & -k_2 & 0 & 0 \\
0 & -k_2 & k_2 + k_3 & -k_3 & 0 \\
0 & 0 & -k_3 & k_3 + k_4 & -k_4 \\
0 & 0 & 0 & -k_4 & k_4
\end{bmatrix}$$
(1.16)

(5) Apply boundary conditions and loads.

식(1.10)에서  $u_1 = 0$  . node 5 에 load P를 준다.

[stiffness matrix]{displacement matrix} = {load matrix}

Solution Phase

6 Solve a system of algebraic equations simultaneously.

주어진  $E, w_1, w_2, t, L, P$  값을 대입하면......

$$A(y) = (w_1 + (\frac{w_1 - w_2}{L})y)t = (2 + \frac{(1 - 2)}{10}y)(0.125) = 0.25 - 0.0125y$$
 (1.18)

식(1.18)으로 각각의 node의 cross-section area를 구한다.

그리고, 앞에서 구한 식으로 stiffness coefficient 와 global stiffness를 구한다. 그리고, 식 (1.17)을 이용하여 displacement  $u_1,u_2,u_3,u_4,u_5$  를 구한다.

Postprocessing Phase

7 Obtain other information

$$\sigma = \frac{f}{A_{avg}} = \frac{k_{eq}(u_{i+1} - u_i)}{A_{avg}} = \frac{\frac{A_{avg}E}{l}(u_{i+1} - u_i)}{A_{avg}} = E(\frac{u_{i+1} - u_i}{l})$$
(1.19)

식(1.19)를 이용하여 각각의 elements의 normal stress를 구한다.

Reaction Forces

 $R_1 = k_1(u_2 - u_1)$  으로 구할 수 있다. 또, 앞의 matrix를 이용하여 구할 수 도 있다.

## 1.6 Minimum total potential energy formulation.

-이 formulation은 solid mechanics 에서의 generating finite element model과 같은 접근 방법이다.

figure 1.15를 통해 이 formulation을 이해 할 수 있다. 또, 이 formulation에서는 Exact displacement method를 사용한다.

figure 1.15에서...

when the member is stretched by a differential amount dy', the stored energy in the material is

$$d\Lambda = \int_0^{y'} F dy' = \int_0^{y'} ky' dy' = \frac{1}{2} ky'^2 = \frac{(1}{2} ky')y'$$
 (1.39)

we can write Eq.(1.39) in terms of the normal stress and strain:

$$d\Lambda = \frac{1}{2} (ky') y' = \frac{(1}{2} \sigma_y dx dz) \epsilon \underline{dy} = \frac{1}{2} \sigma \epsilon dV$$
\nelastic force

 $d\Lambda = \frac{1}{2} (ky') y' = \frac{(1}{2} \sigma_y dx dz) \varepsilon \ dy = \frac{1}{2} \sigma \varepsilon \ dV$ \nelastic force y'member or an element under axial loading the Therefore, for a member or an element under axial loading, the strain energy A given by

$$\Lambda^{(e)} = \int d\Lambda = \int_{V} \frac{\delta \varepsilon}{2} dV = \int_{V} \frac{E \varepsilon^{2}}{2} dV$$
 (1.40)

where V is the volume of the member.

The total potential energy  $\Pi$  for a body consisting of n elements and m nodes is the difference between the total strain energy and the work done by the external force:

$$\Pi = \sum_{e=1}^{m} \Lambda^{(e)} \left( \sum_{i=1}^{m} F_{i} u_{i} \right) : \text{ total potential energy}$$
(1.42)

the value of the system's total potential energy is a minimum. 一 月對

$$\frac{\partial \Pi}{\partial u_i} = \frac{\partial}{\partial u_i} \sum_{e=1}^{n} \Lambda^{(e)} - \frac{\partial}{\partial u_i} \sum_{i=1}^{m} Fu_i = 0 \quad \text{for} \quad i = 1, 2, 3, ..., n$$
 (1.42)

Example 1.1에서 ... the strain energy for an arbitrary element (e) can be determined from Eq.(1.40) as

$$\Lambda^{(e)} = \int_{V} \frac{E \varepsilon^{2}}{2} dV = \frac{A_{avg} E}{2l} (u_{i+1}^{2} + u_{i}^{2} - 2u_{i+1} u_{i})$$
 (1.43)

where  $\varepsilon = (u_{i+1} - u_i)/l$ 

Minimizing the strain energy with respect to  $u_i$  and  $u_{i+1}$  leads to

$$\frac{\partial \Lambda^{(e)}}{\partial u_i} = \frac{A_{avg}E}{l} (u_i - u_{i+1})$$

$$\frac{\partial \Lambda^{(e)}}{\partial u_{i+1}} = \frac{A_{avg}E}{l} (u_{i+1} - u_i)$$
(1.44)

in matrix form,

$$\begin{pmatrix}
\frac{\partial \Lambda^{(e)}}{\partial u_{i}} \\
\frac{\partial \Lambda^{(e)}}{\partial u_{i+1}}
\end{pmatrix} = \begin{bmatrix}
k_{eq} & -k_{eq} \\
-k_{eq} & k_{eq}
\end{bmatrix} \begin{pmatrix} u_{i} \\ u_{i+1} \end{pmatrix}$$
(1.45)

where  $k_{eq} = (A_{avg}E)/l$ 

Minimizing the work done by the external forces at the nodes i and i +1 of an arbitrary element (e) , we get

$$\frac{\partial}{\partial u_i} (F_i u_i) = F_i$$

$$\frac{\partial}{\partial u_{i+1}} (F_{i+1} u_{i+1}) = F_{i+1}$$

$$(1.46)$$

For Example1.1, the minimum total potential energy formulation leads to a global stiffness matrix that is identical to the one obtained from direct formulation:

$$[K]^{(G)} = \begin{bmatrix} k_1 & -k_1 & 0 & 0 & 0 \\ -k_1 & k_1 + k_2 & -k_2 & 0 & 0 \\ 0 & -k_2 & k_2 + k_3 & -k_3 & 0 \\ 0 & 0 & -k_3 & k_3 + k_4 & -k_4 \\ 0 & 0 & 0 & -k_4 & k_4 \end{bmatrix}$$

Furthermore, application of the boundary condition and the load result in :

$$\begin{bmatrix} 1 & 0 & 0 & 0 & 0 \\ -k_1 & k_1 + k_2 & -k_2 & 0 & 0 \\ 0 & -k_2 & k_2 + k_3 & -k_3 & 0 \\ 0 & 0 & -k_3 & k_3 + k_4 & -k_4 \\ 0 & 0 & 0 & -k_4 & k_4 \end{bmatrix} \begin{pmatrix} u_1 \\ u_2 \\ u_3 \\ u_4 \\ u_5 \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \\ 0 \\ 0 \\ P \end{pmatrix}$$
 (1.47)

MARCHALLINA FEW

1.7 Weighted residual formulation : 모바다 error를 하다 이 되고 하는 방법 가는 카막 카막 기가 기가 기가 기가 기가 기가 기가 기가 기가 기가 기가 기가 기가

DRAM DTMH TO Plate TO Shell

The weighted residual methods are based on assuming an approximate solution for the governing differential equation.

White weighted residual methods are based on assuming an approximate solution for the governing differential equation.

White weighted residual methods are based on assuming an approximate solution for the governing differential equation.

Example 1.1. The governing differential equation and the corresponding boundary condition for this problem are as follows:

$$A(y)E\frac{du}{dy}-P=0 \quad \text{subject to the boundary condition } u(0)=0 \qquad (1.54)$$

$$A(y)E\frac{du}{dy}-P=0 \quad \text{subject to the boundary condition } u(0)=0 \qquad (1.54)$$

Next, we need to assume an approximate solution. Again, keep in mind that the assumed solution must satisfy the boundary condition. We chose

$$u(y) = c_1 y + c_2 y^2 + c_3 y^3$$
 (1.55)

where  $c_1, c_2$ , and  $c_3$  are unknown coefficients. Equation (1.55) certainly satisfies the fixed boundary condition represented by u(0)=0. Substitution of the assumed solution, Eq. (1.55), into the governing differential equation, Eq.(1.54), yields the error function  $\mathcal{R}$ :

$$\frac{(w_1 + (\frac{w_2 - w_1}{L}y)t E (c_1 + 2c_2y + 3c_3y^2) - P}{A(y)} = \Re$$
(1.56)

Substituting for values of  $w_1$ ,  $w_2$ , L, t, and E in Example 1.1 and simplifying, we get

$$\mathcal{R}/E = (0.25 - 0.0125y)(c_1 + 2c_2y + 3c_3y^2) - 96.154 \times 10^{-6}$$

이 method (find unknown coefficients  $c_1$ ,  $c_2$  and  $c_3$ )에는 ① Collocation method ② Subdomain method ③ Galerkin method ④ Least-Squares method 이 있다. 이러한 method는 어떠한 것을 사용해도 결과는 별 차이 없이 정확한 값을 구할 수 있다. 하지만 Galerkin method가 좀더 자세하고 problem을 깊게 살필 수 있기 때문에 가장 많이 사용된다. 앞으로 chapter 4, 7에서 다루게 될 것이다.

## 1.8 Verification of results

### ANSYS의 사용에서

- ① Wrong input data, such as physical properties and dimensions.
- ② Selecting inappropriate types of elements.
- 3 Poor element shape and size after meshing.
- 4 Applying wrong boundary conditions and loads.
- 위와 같은 문제로 인해 잘못된 해석이 될 수 있으므로 항상 결과를 확인해 봐야 한다.

## Chapter 2 Trusses

Trusse All Mys.

## 2.1 Definition of a truss

A truss is an engineering structure consisting of straight members connected at their ends by means of bolts, rivets, pins, or welding.

Truss 구조에서는 compression 과 tension 의 두 가지 힘 만 고려하면 된다.

## 2.2. Finite elements formulation.

The average stresses in any two-force member are given by

$$\sigma = \frac{F}{A} \tag{2.1}$$

The average strain of the member can be expressed by

$$\varepsilon = \frac{\Delta L}{L} \tag{2.2}$$

Over the elastic region, the stress and strain are related by Hook's Law,

$$\sigma = E \varepsilon \tag{2.3}$$

Combining Eqs. (2.1), (2.2), and (2.3) and simplifying, we have

$$F = \left(\frac{AE}{L}\right) \triangle L \tag{2.4}$$

Eq. (2.4) is similar to the equation of a linear spring, F = kx. Therefore,

$$k_{eq} = \frac{AE}{L} \tag{2.5}$$

in figure 2.5 ...

The global displacements are related to the local displacements according to the equations

$$U_{iX} = u_{ix}\cos\theta - u_{iy}\sin\theta$$

$$U_{iY} = u_{ix}\sin\theta + u_{iy}\cos\theta$$

$$U_{iX} = u_{ix}\cos\theta - u_{iy}\sin\theta$$

$$U_{iX} = u_{ix}\cos\theta - u_{iy}\sin\theta$$

$$U_{iY} = u_{ix}\sin\theta + u_{iy}\cos\theta$$

Transformation Matrix.

in matrix form ...

$$\{U\} = [T] \{u\}$$
 (2.7)

where

$$\{U\} = \begin{pmatrix} U_{iX} \\ U_{iY} \\ U_{jX} \\ U_{jY} \end{pmatrix}, \quad [T] = \begin{bmatrix} \cos\theta & -\sin\theta & \mathbf{0} & \mathbf{0} \\ \sin\theta & \cos\theta & \mathbf{0} & \mathbf{0} \\ \mathbf{0} & \mathbf{0} & \cos\theta & -\sin\theta \\ \mathbf{0} & \mathbf{0} & \sin\theta & \cos\theta \end{bmatrix}, \quad \text{and} \quad \{\mathbf{W}\} = \begin{pmatrix} u_{ix} \\ u_{iy} \\ u_{jx} \\ u_{iy} \end{pmatrix}$$

the local and global forces may be related according to the equations

$$F_{iX} = f_{ix}\cos\theta - f_{iy}\sin\theta$$

$$F_{iY} = f_{ix}\sin\theta + f_{iy}\cos\theta$$

$$F_{jX} = f_{jx}\cos\theta - f_{jy}\sin\theta$$

$$F_{jY} = f_{ix}\sin\theta + f_{iy}\cos\theta$$
(2.8)

The local internal forces and displacements are related through the stiffness matrix

$$\begin{pmatrix} f_{ix} \\ f_{iy} \\ f_{jx} \\ f_{jy} \end{pmatrix} = \begin{bmatrix} k & 0 & -k & 0 \\ 0 & 0 & 0 & 0 \\ -k & 0 & k & 0 \\ 0 & 0 & 0 & 0 \end{bmatrix} \begin{pmatrix} u_{ix} \\ u_{iy} \\ u_{jx} \\ u_{jy} \end{pmatrix}$$
(2.10)

where  $k = k_{eq} = \frac{AE}{L}$  , and using matrix form we can write

$$\{f\} = [K] \{u\}$$
 (2.11)

After substituting for {f} and {u} in terms of {F} and {U}, we have

$$\underbrace{[T]^{-1}\{F\}}_{\text{ff}} = [K]\underbrace{[T]^{-1}\{U\}}_{\text{fwf}}$$
 where  $[T]^{-1}$  is the inverse of the transformation matrix [T] and is

$$[T] = \begin{bmatrix} \cos \theta & \sin \theta & \mathbf{0} & \mathbf{0} \\ -\sin \theta & \cos \theta & \mathbf{0} & \mathbf{0} \\ 0 & 0 & \cos \theta & \sin \theta \\ 0 & 0 & -\sin \theta & \cos \theta \end{bmatrix}$$
(2.13)

Multiplying both sides of Eq.(2.12) by [T] and simplifying, we obtain :

$${F} = [T][K][T]^{-1} {U}$$
 (2.14)

Substituting for values of the [T], [K],  $[T]^{-1}$ , and  $\{U\}$  matrices in Eq.(2.14) and multiplying, we are left with

$$\begin{pmatrix}
F_{ix} \\
F_{iy} \\
F_{jx} \\
F_{jy}
\end{pmatrix} = 
\begin{pmatrix}
\cos^{2}\theta & \sin\theta\cos\theta & -\cos^{2}\theta & -\sin\theta\cos\theta \\
\sin\theta\cos\theta & \sin^{2}\theta & -\sin\theta\cos\theta & -\sin^{2}\theta \\
-\cos^{2}\theta & -\sin\theta\cos\theta & \cos^{2}\theta & \sin\theta\cos\theta \\
-\sin\theta\cos\theta & -\sin^{2}\theta & \sin\theta\cos\theta & \sin^{2}\theta
\end{pmatrix}
\begin{pmatrix}
U_{iX} \\
U_{iY} \\
U_{jX} \\
U_{jY} \\
U_{jX} \\
U_{jY}
\end{pmatrix}$$
(2.15)

Equations (2.15) express the relationship between the applied forces, the element stiffness matrix  $[K]^{(e)}$ , and the global deflection of the nodes of an arbitrary element. The stiffness matrix  $[K]^{(e)}$  for any member (element) of the truss is

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin\theta\cos\theta \\ \sin\theta\cos\theta & \sin^2\theta & -\sin\theta\cos\theta & -\sin^2\theta \\ -\cos^2\theta & -\sin\theta\cos\theta & \cos^2\theta & \sin\theta\cos\theta \\ -\sin\theta\cos\theta & -\sin^2\theta & \sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin^2\theta \\ -\sin^2\theta & -\sin^2\theta & \sin\theta\cos\theta \\ -\sin^2\theta & \sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin^2\theta \\ -\sin^2\theta & -\sin^2\theta & \sin\theta\cos\theta \\ -\sin^2\theta & \sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin^2\theta \\ -\cos^2\theta & -\sin^2\theta & \sin^2\theta \\ -\sin^2\theta & \sin^2\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin^2\theta \\ -\cos^2\theta & -\sin^2\theta & \sin^2\theta \\ -\sin^2\theta & \sin^2\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\sin^2\theta \\ -\cos^2\theta & -\sin^2\theta & \sin^2\theta \\ -\sin^2\theta & \sin^2\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & -\sin^2\theta & \sin^2\theta \\ -\sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

$$[K]^{(e)} = k \begin{bmatrix} \cos^2\theta & \sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & -\sin^2\theta \\ -\sin\theta\cos\theta & \sin^2\theta \end{bmatrix}$$

#### 2.3. Space Trusses

~ 3-D truss를 space truss라 부른다.

#### 2.4. Overview of the ANSYS program.

Ansys program을 실행하는 방법과 Ansys **program 창의 utility** menu, main menu, Toolbar, Graphical picking, help system 에 관한 간략한 설명과 소개가 있다.

- @ Utility Menu: Contains utility functions that are available throughout the ANSYS session, such as file controls, selecting, and graphics controls. You will also exit the ANSYS program through this menu.
- @ Main Menu : Contains the primary ANSYS functions, organized by processors. These functions include preprocessor, solution, general postprocessor, design optimizer, etc.
- @ Toolbar: Contains push buttons that execute commonly used ANSYS commands and function. You may add your own push buttons by defining abbreviations.
- @ Input Window: Shows program prompt messages and allows you to type in

commands directly. All previously typed-in commands also appear in this window for easy reference and access.

- @ Graphics Window: A window where graphics displays are drawn.
- @ Output Window: Receives text output from the program. It is usually positioned behind the other windows and can be brought to the front when necessary.

### 2.5 Examples using Ansys.

ex 2.1을 Ansys를 이용하여 해석하는 과정을 보여준다. 또 ex 2.2 (3-D) truss의 해석도 나타나있다.

## # 예제 2.1, 2.2 의 Ansys program을 이용한 해석과 analytical solution의 비교

우선 Ansys를 이용한 것이 analytical한 방**법보다 훨씬 쉽고** 정확한 값을 구할 수 있다. (예 2.1) 에서 두가지의 결과 값을 보면.

analytical.....

Ansys.....

$$\begin{pmatrix} U_{1x} \\ U_{1y} \\ U_{2x} \\ U_{2y} \\ U_{3x} \\ U_{3x} \\ U_{4x} \\ U_{4y} \\ U_{5x} \\ U_{5y} \end{pmatrix} = \begin{pmatrix} 0 \\ 0 \\ -0.00355 \\ -0.01026 \\ 0 \\ 0 \\ 0.00118 \\ -0.0114 \\ 0.00240 \\ -0.0195 \end{pmatrix}$$

이와 같이 결과 값은 거의 같음을 볼 수 있다. 이렇듯 두가지 방법 모두 정확한 결과를 볼 수 있다. 하지만 구조가 매우 복잡해지면 analytical 한 방법으로 한계가 있을 것이다. 그리므로 이러한 문제에 있어서는 ansys program 을 이용하는 것이 훨씬 쉬울 것이다. ansys 는 modeling 이 이루어지지 않으면 결과가 잘못된다. 또 ansys program 은 변위뿐 아니라 다른 결과를 보기 위해서는 해석 방법만 달리 해주면 되므로 매우 편리하다.

## Chapter 3 One-Dimensional Elements

## 3.1 Linear Elements

Linear temperature distribution for a typical element

$$T^{(e)} = c_1 + c_2 X$$

$$T = T_i$$
 at  $X = X_i$   
 $T = T_j$  at  $X = X_j$ 

$$T = T_i$$
 at  $X = X_i$ 

$$ratio 24 \rightarrow 347$$
  
(.3.2)  $\Rightarrow$  (3.1)

$$T_i = c_1 + c_2 X_i$$

$$T_j = c_1 + c_2 X_j$$

$$c_1 = \frac{T_i X_j - T_j X_i}{X_i - X_i} \tag{3.4}$$

$$c_2 = \frac{T_j - T_i}{X_i - X_i} \tag{3.5}$$

(3.1)

(3.2)

(3.3)

(3.1)은 .....

$$T^{(e)} = \frac{T_i X_j - T_i X_i}{X_j - X_i} + \frac{T_j - T_i}{X_j - X_i} X \tag{3.6}$$

$$\Rightarrow T^{(e)} = \left(\frac{X_i - X}{X_j - X_i}\right) T_i + \left(\frac{X - X_i}{X_j - X_i}\right) T_j \tag{3.7}$$

define the shape functions,  $S_i$  and  $S_i$  ...

$$S_{i} = \frac{X_{i} - X}{X_{i} - X_{i}} = \frac{X_{i} - X}{l} \tag{3.8}$$

$$S_i = \frac{X - X_i}{X_i - X_i} = \frac{X - X_i}{l} \tag{3.9}$$

l: length of the element

$$T^{(e)} = S_i T_i + S_i T_i (3.10)$$

(3.10)을 matrix form ...

$$T^{(e)} = [S_i \quad S_j] \begin{pmatrix} T_i \\ T_i \end{pmatrix} \tag{3.11}$$

For the structural example, the deflection u(1) for a typical colum element.....

$$u^{(e)} = [S_i \ S_j] \begin{pmatrix} u_i \\ u_j \end{pmatrix}$$

where  $u_i$  and  $u_j$  represent the deflections of nodes I and j of an arbitrary element (e). in general...

$$\Psi^{(e)} = [S_i \ S_j] \begin{pmatrix} \Psi_i \\ \Psi_i \end{pmatrix}$$

where  $\Psi_i$  and  $\Psi_j$  represent the nodal values of the unknown variable, such as temperature, or deflection, or velocity.

Properties of shape functions

$$S_{i}|_{X=X_{i}} = \frac{X-X_{i}}{l}|_{X=X_{i}} = \frac{X_{i}-X_{i}}{l} = 1$$
and  $S_{i}|_{X=X_{i}} = \frac{X-X_{i}}{l}|_{X=X_{i}} = \frac{X_{i}-X_{j}}{l} = 0$  (3.14)

Also evaluating  $S_j$  at  $X=X_j$  and  $X=X_j$  ...

$$S_{i} \mid_{X=X_{i}} = \frac{X-X_{i}}{l} \mid_{X=X_{i}} = \frac{X_{i}-X_{i}}{l} = 0$$
  
and  $S_{i} \mid_{X=X_{i}} = \frac{X-X_{i}}{l} \mid_{X=X_{i}} = \frac{X_{i}-X_{i}}{l} = 1$  (3.15)

(형상함수는 자기 절 점에서는 값은 1 이고, 다른 절 점에서의 값은 0 이다.)

Another important property associated with shape functions is that the shape functions add up to a value of unity that is,

$$S_i + S_j = \frac{X_i - X_i}{X_i - X_i} + \frac{X - X_i}{X_i - X_i} = 1$$
(3.16)

It can also be readily shown that he linear shape functions, the sum of the derivatives with respect to X is zero.

$$\frac{d}{dX}(\frac{X_i - X}{X_i - X_i}) + \frac{d}{dX}(\frac{X - X_i}{X_i - X_i}) = -\frac{1}{X_i - X_i} + \frac{1}{X_i - X_i} = 0$$
(3.17)

27

## 3.2 Quadratic elements

figure 3.7 ...

$$T^{(e)} = c_1 + c_2 X + c_3 X^2 (3.18)$$

$$T = T_i \quad at \quad X = X_i \qquad \Rightarrow \qquad T_i = c_1 + c_2 X_i + c_3 X_i^2$$

$$T = T_k \quad at \quad X = X_k \qquad \qquad T_k = c_1 + c_2 X_k + c_3 X_k^2$$

$$T = T_j \quad at \quad X = X_j \qquad \qquad T_j = c_1 + c_2 X_j + c_3 X_j^2$$

 $c_1$ ,  $c_2$ ,  $c_3$ 에 대해 풀고... shape function 으로...

$$T^{(e)} = S_i T_i + S_j T_j + S_K T_k (3.21)$$

in matrix form...

$$T^{(e)} = \begin{bmatrix} S_i & S_j & S_k \end{bmatrix} \begin{pmatrix} T_i \\ T_j \\ T_k \end{pmatrix}$$
(3.22)

where shape functions are ...

$$S_{i} = \frac{2}{l^{2}} (X - X_{i})(X - X_{k})$$

$$S_{j} = \frac{2}{l^{2}} (X - X_{i})(X - X_{k})$$

$$S_{k} = \frac{-4}{l^{2}} (X - X_{i})(X - X_{k})$$
(3.23)

$$\Rightarrow \qquad \Psi^{(e)} = [S_i \quad S_j S_k] \begin{pmatrix} \Psi_j \\ \Psi_j \\ \Psi_k \end{pmatrix} \tag{3.24}$$

(3.24)식은 linear shape function 과 버슷하다. 그것은...

- (1), a shape function has a value of unity at its corresponding node a value of zero at the other adjacent node.
- (2). if we sum up the shape functions, we will again come up with a value of unity.

Linear shape functions와 quadratic shape functions의 다른 점은 quadratic shape functions의 적분 값의 합이 zero가 아니라는 것이다.

3.3 Cubic elements

figure 3.8

$$T^{(e)} = c_1 + c_2 X + c_3 X^2 + c_4 X^3 \tag{3.25}$$

$$\Rightarrow T^{(e)} = S_i T_i + S_j T_j + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_K T_k + S_$$

$$T^{(e)} = \begin{bmatrix} \mathbf{S}_{i} & \mathbf{S}_{j} & \mathbf{S}_{k} & \mathbf{S}_{m} \end{bmatrix} \begin{pmatrix} T_{i} \\ T_{j} \\ T_{k} \\ T_{m} \end{pmatrix}$$
(3.28)

where the shape functions are ...

$$S_{i} = \frac{9}{2l^{5}} (X - X_{i})(X - X_{i})(X - x_{m})$$

$$S_{j} = \frac{9}{2l^{5}} (X - X_{i})(X - X_{m})(X - x_{m})$$

$$S_{k} = \frac{27}{2l^{5}} (X - X_{i})(X - X_{i})(X - x_{m})$$

$$S_{m} = \frac{-27}{2l^{5}} (X - X_{i})(X - X_{i})(X - x_{k})$$
(3.29)

The functions must be selected such that when evaluated at nodes j, k and m, the outcome is a value of zero.

We select ...

$$S_{i} = a_{i}(X - X_{i})(X - X_{i})(X - X_{i})$$
(3.30)

which satisfies the above condition. That is, if you substitute for  $X = X_j$ , or  $X = X_k$ , or  $X = X_m$ , the value of  $S_i$  is zero. We then evaluate  $a_1$  such that when the shape function  $S_i$  is evaluated at node I, it will produce a value of unity.

$$1 = a_1(X_i - X_j)(X_i - X_k)(X_i - X_{mi}) = a_1(-1)(-\frac{l}{3})(-\frac{2l}{3})$$
 solving for, we get 
$$a_1 = -\frac{9}{2l^3}$$
 \(\frac{2}{3}\) (3.30).....

$$S_i = -\frac{9}{2l^3}(X - X_i)(X - X_i)(X - X_m)$$

Keep in mind the explanation offered above, we can generate shape functions of an(n-1)-order polynomial directly from the Lagrange Polynomial formula:

$$S_{k} = \prod_{M=1}^{N} \frac{X - XM}{X_{k} - XM} \quad \underbrace{omitting} \quad (X - X_{k})$$

$$= \frac{(X - X_{1})(X - X_{2}) \cdot \cdot \cdot (X - X_{k})}{(X_{k}X_{1})(X_{k} - X_{2}) \cdot \cdot \cdot (X_{k} - X_{k})}$$
(3.31)

$$\Rightarrow \Psi^{(e)} = [S_i \ S_j \ S_k \ S_m] \stackrel{\P_i}{\longrightarrow} \Psi_i$$

3.4 Global , Local , Natural Coordinates

figure 3.9

![](_page_17_Picture_5.jpeg)

Substituting for X in terms of the local coordinate x in Eqs.(3.8) and (3.9), we get

$$S_i = \frac{X_i - X}{l} = \frac{X_i - (X_i + x)}{l} = 1 - \frac{x}{l}$$
 (3.32)

$$S_{j} = \frac{X - X_{i}}{l} = \frac{(X_{i} + x) - X_{i}}{l} = \frac{x}{l}$$
(3.33)

Where the local coordinate x varies from 0 to l; that is  $0 \le x \le l$ 

One-Dimensional Linear Natural Coordinates

figure 3.10 
$$\xi = \frac{2\pi}{l} - 1$$
  $t = 0$   $t = -1$ 

Where x is the local coordinate, there we can specify the coordinates of node I as -1 and node j by 1

Eqs.(3.32), (3.33) .....

$$S_i = \frac{1}{2}(1 - \xi) \tag{3.34}$$

$$S_j = \frac{1}{2}(1+\beta) \tag{3.35}$$

$$T^{(e)} = S_i T_i + S_j T_j = \frac{1}{2} (1 - \xi) T_i + \frac{1}{2} (1 + \xi) T_j$$
 (3.36)

It is clear that at  $\xi=-1$  ,  $T=T_i$  and  $\xi=1$  ,  $T=T_j$ 

$$u^{(e)} = S_i u_i + S_j u_j = \frac{1}{2} (1 - \xi) u_i + \frac{1}{2} (1 + \xi) u_j$$
 (3.36a)

Also note that the transformation from the global coordinate  $X(X_i \le X \le X_j)$  or the local coordinate  $x(0 \le x \le 0)$  to  $\xi$  can be using the same shape functions  $S_i$  and  $S_j$ 

$$X = S_{i}X_{i} + S_{j}X_{i} = \frac{1}{2}(1 - \xi)X_{i} + \frac{1}{2}(1 + \xi)X_{j}$$

$$x = S_{i}x_{i} + S_{j}x_{j} = \frac{1}{2}(1 - \xi)x_{i} + \frac{1}{2}(1 + \xi)x_{j}$$
(3.36b)

One - Dimensional Natural Quadratic and Cubic Shape Functions

The quadratic natural shape functions

$$S_i = -\frac{1}{2} \, \xi (1 - \xi) \tag{3.37}$$

$$S_{j} = \frac{1}{2} \xi (1 + \xi) \tag{3.38}$$

$$S_{k} = (1 + \xi) (1 - \xi)$$
 (3.39)

The natural one - dimensional cubic shape functions are :

$$S_i = \frac{1}{16} (1 - \xi)(3\xi + 1)(3\xi - 1) \tag{3.40}$$

$$S_{j} = \frac{1}{16} (1 + \xi)(3\xi + 1)(3\xi - 1) \tag{3.41}$$

$$S_k = \frac{9}{16} (1 + \xi)(\xi - 1)(3\xi - 1) \tag{3.42}$$

$$S_m = \frac{9}{16}(1+\xi)(1-\xi)(3\xi+1) \tag{3.43}$$

3.5 Numerical integration: Gauss - Legendre Quadrature

$$I = \int_a^b f(x)dx = \sum_{i=1}^n w_i f(x_i)$$

$$x = c_0 + c_1 \lambda$$

$$a = c_0 + c_1(-1)$$
  
 $b = c_0 + c_1(1)$ 

Solving for 
$$c_0$$
 and  $c_1$ ,

$$c_0 = \frac{(b+a)}{2}$$

$$c_1 = \frac{(b-a)}{2}$$

$$x = \frac{(b+a)}{2} + \frac{(b-a)}{2}\lambda \tag{3.45}$$

$$dx = \frac{(b-a)}{2} d\lambda \tag{3.46}$$

$$\Rightarrow I = \int_{-1}^{1} f(\lambda) d\lambda = \sum_{i=1}^{n} w_{i} f(\lambda_{i})$$
 (3.47)

The two - point Gauss - Legendre formulation requires the determination of two weighting factors  $w_1$  and  $w_2$  and two sampling points  $\lambda_1$  and  $\lambda_2$  to evaluate the function at these points. Because there are four unknowns, four equations are created using Legendre polynomials  $(1,\lambda,\lambda^2,\lambda^3)$  as follows:

$$w_{1} f(\lambda_{1}) + w_{2} f(\lambda_{2}) = \int_{-1}^{1} 1 d\lambda = 2$$

$$w_{1} f(\lambda_{1}) + w_{2} f(\lambda_{2}) = \int_{-1}^{1} \lambda d\lambda = 0$$

$$w_{1} f(\lambda_{1}) + w_{2} f(\lambda_{2}) = \int_{-1}^{1} \lambda^{2} d\lambda = \frac{2}{3}$$

$$w_{1} f(\lambda_{1}) + w_{2} f(\lambda_{2}) = \int_{-1}^{1} \lambda^{3} d\lambda = 0$$

#2

The above equations lead to the equations

$$w_1(1) + w_2(1) = 2$$

$$w_1(\lambda_1) + w_2(\lambda_2) = 0$$

$$w_1(\lambda_1)^2 + w_2(\lambda_2)^2 = \frac{2}{3}$$

$$w_1(\lambda_1)^3 + w_2(\lambda_2)^3 = 0$$

N=3, 4, 5 of ay
W (weighting function) 7227.

particular, e roots are ardized so is the roots are on the

ige occurs in as there some in Gaussian example, in be safely used equired. More iputed directly

can be rather.
The nodes and that

ghts for various 365). Since these din calcular 1 rational value to the computarture formula ce of quadratic, and the reamelines.

TABLE 5.1
GAUSSIAN QUADRATURE FORMULA NODES AND WEIGHTS

| n | Nodes x <sub>i</sub>                                     | Weights A,                                                             |
|---|----------------------------------------------------------|------------------------------------------------------------------------|
| 2 | $-\sqrt{\frac{1}{3}}$                                    | 1                                                                      |
|   | $+\sqrt{\frac{1}{3}}$                                    | 1                                                                      |
| 3 | $-\sqrt{\frac{3}{5}}$                                    | . <u>5</u>                                                             |
|   | 0                                                        | <u>8</u><br>9                                                          |
|   | $+\sqrt{\frac{3}{5}}$                                    | <u>5</u>                                                               |
| 4 | $-\sqrt{\frac{1}{7}(3-4\sqrt{0.3})}$                     | $\frac{1}{2} + \frac{1}{12} \sqrt{\frac{10}{3}}$                       |
|   | $-\sqrt{\frac{1}{7}(3+4\sqrt{0.3})}$                     | $\frac{1}{2} - \frac{1}{12}\sqrt{\frac{10}{3}}$                        |
|   | $+\sqrt{\frac{1}{7}(3-4\sqrt{0.3})}$                     | $\frac{1}{2} + \frac{1}{12}\sqrt{\frac{10}{3}}$                        |
|   | $+\sqrt{\frac{1}{7}(3+4\sqrt{0.3})}$                     | $\frac{1}{2} - \frac{1}{12} \sqrt{\frac{10}{3}}$                       |
| 5 | $-\sqrt{\frac{1}{9}\bigg(5-2\sqrt{\frac{10}{7}}\bigg)}$  | $0.3\frac{\left(-0.7+5\sqrt{0.7}\right)}{\left(-2+5\sqrt{0.7}\right)}$ |
| • | $-\sqrt{\frac{1}{9}\bigg(5+2\sqrt{\frac{10}{7}}\bigg)}$  | $0.3\frac{(0.7+5\sqrt{0.7})}{(2+5\sqrt{0.7})}$                         |
|   | 0                                                        | 128<br>225                                                             |
|   | $+\sqrt{\frac{1}{9}\left(5-2\sqrt{\frac{10}{7}}\right)}$ | $0.3\frac{(-0.7+5\sqrt{0.7})}{(-2+5\sqrt{0.7})}$                       |
|   | $+\sqrt{\frac{1}{9}\left(5+2\sqrt{\frac{10}{7}}\right)}$ | $0.3\frac{(0.7+5\sqrt{0.7})}{(2+5\sqrt{0.7})}$                         |

常处在时间 千年 39年。 ① 25公司司

Chapter 5 Two - Dimensional Elements

@ 318.

### 5.1 Rectangular elements

![](_page_21_Figure_4.jpeg)

FIGURE 5.2 A typical rectangular element.  $T^{(e)} = b_1 + b_2 x + b_3 y + b_4 x y$ 

Considering nodal temperatures, we satisfy the following conditions:

$$T = T_i$$
 at  $x = 0$  and  $y = 0$   
 $T = T_j$  at  $x = l$  and  $y = 0$   
 $T = T_m$  at  $x = l$  and  $y = w$   
 $T = T_n$  at  $x = 0$  and  $y = w$ 

Applying the nodal conditions given by Eq.(5.2) to Eq.(5.1) and solving for  $b_1$  ,  $b_2$  ,  $b_3$  , and  $b_4$  , we have :

$$b_1 = T_i$$
  $b_2 = \frac{1}{l}(T_j - T_i)$   $b_3 = \frac{1}{w}(T_n - T_i)$   $b_4 = \frac{1}{lw}(T_i - T_j + T_m - T_n)$ 

(5.3)

(5.1)

Substituting expressions given for  $b_1$ ,  $b_2$ ,  $b_3$ , and  $b_4$ , into Eq.(5.1) and regrouping parameters will result in the temperature distribution for a typical

element in terms of shape functions:

$$T^{(e)} = \begin{bmatrix} S_i & S_j & S_m & S_n \end{bmatrix} \begin{pmatrix} T_i \\ T_j \\ T_m \\ T \end{pmatrix}$$
 (5.4)

The shape functions in the above expression are

(5.5) 
$$S_{i} = (1 - \frac{x}{l})(1 - \frac{y}{w})$$
$$S_{j} = \frac{x}{l}(1 - \frac{y}{w})$$
$$S_{m} = \frac{xy}{lw}$$

$$S_n = \frac{y}{w}(1 - \frac{x}{l})$$

in general ...

$$\Psi^{(e)} = [S_i S_j S_m S_n] \begin{pmatrix} \Psi_i \\ \Psi_j \\ \Psi_m \\ \Psi \end{pmatrix}$$
 (5.6)

Natural Coordinates Granden gundrotoire & 1871 48.

figure 5.3 ...  $\xi = 1$  and  $\eta = -1$ 

If we let  $\xi=\frac{2x}{l}-1$  and  $\mathfrak{n}=\frac{2y}{w}-1$  , then the shape functions in terms of the natural coordinates  $\xi$  and  $\mathfrak{n}$  are

$$S_{i} = \frac{1}{4}(1-\xi)(1-\eta)$$

$$S_{j} = \frac{1}{4}(1+\xi)(1-\eta)$$

$$S_{m} = \frac{1}{4}(1+\xi)(1+\eta)$$

$$S_{n} = \frac{1}{4}(1-\xi)(1+\eta)$$
(5.7)

5.2 Quadratic quadrilateral elements

$$\begin{array}{cccccccccccccccccccccccccccccccccc$$

In terms of the natural coordinates  $\xi$  and  $\eta$ , the eight-node quadratic element has the general form of

$$\Psi^{(e)} = b_1 + b_2 \xi + b_3 \eta + b_4 \xi \eta + b_5 \xi^2 + b_6 \eta^2 + b_7 \xi^2 \eta + b_8 \xi \eta^2$$
 (5.8)

In general, the shape function associated with each node can be represented in terms of the product of two functions  $F_1$  and  $F_2$ :

$$S = F_1(\xi, \eta) F_2(\xi, \eta)$$

erentify (5.9)

For a given node, we select the first function  $F_1$  such that it will produce a value of zero when evaluated along the sides of the element that the given node does not contact. Moreover, the second function  $F_2$  is selected such that when multiplied by  $F_1$ , it will produce a value of unity at the given node and a value of zero at other neighboring nodes.

First,  $F_1$  must be selected such that along the ij-side (n=-1) and in-side  $(\xi=-1)$ , the function will produce a value of zero. We select

$$F_1(\xi, \eta) = (1+\xi)(1+\eta)$$

which satisfies the condition. We then select

$$F_2(\xi, \eta) = c_1 + c_2 \xi + c_3 \eta$$

 $S_m$  at node m should give  $S_m=1$  for  $\xi=1$  and  $\eta=1$   $S_m$  at node l should give  $S_m=0$  for  $\xi=1$  and  $\eta=0$   $S_m$  at node o should give  $S_m=0$  for  $\xi=0$  and  $\eta=1$  Applying these conditions to Eq.(5.9), we obtain

$$1 = (1+1)(1+1)(c_1 + c_2(1) + c_3(1)) = 4c_1 + 4c_2 + 4c_3$$

$$0 = (1+1)(1+0)(c_1 + c_2(1) + c_3(0)) = 2c_1 + 2c_2$$

$$0 = (1+0)(1+1)(c_1 + c_2(0) + c_3(1)) = 2c_1 + 2c_3$$

which results in

$$c_1 = -\frac{1}{4}$$
,  $c_2 = \frac{1}{4}$ , and  $c_3 = \frac{1}{4}$  with  $S_m = (1+\xi)(1+\eta)(-\frac{1}{4}+\frac{1}{4}\xi+\frac{1}{4}\eta)$ 

The corner node shape functions are:

$$S_{i} = -\frac{1}{4}(1-\xi)(1-\eta)(1+\xi+\eta)$$

$$(5.10)$$

$$S_{j} = \frac{1}{4}(1+\xi)(1-\eta)(-1+\xi-\eta)$$

$$S_{m} = \frac{1}{4}(1+\xi)(1+\eta)(-1+\xi+\eta)$$

$$S_{n} = -\frac{1}{4}(1-\xi)(1+\eta)(1+\xi-\eta)$$

 $F_1$  must be selected such that along the ij-side (n=-1), in-side  $(\xi=-1)$ , and jm-side  $(\xi=1)$ , the function will produce a value of zero. We select

$$F_1(\xi, \eta) = (1-\xi)(1+\eta)(1+\xi)$$
  
 $F_2(\xi, \eta) = c_1$ 

Applying the nodal condition

$$S_o = 1$$
 for  $\xi = 0$  and  $\eta = 1$ 

leads to

$$1 = (1-0)(1+1)(1+0) c_1 = 2c_1$$

resulting in

$$c_1 = \frac{1}{2}$$
 with  $S_o = \frac{1}{2}(1-\xi)(1+\eta)(1+\xi) = S_o = \frac{1}{2}(1+\eta)(1-\xi^2)$ 

The midpoint shape functions are:

(5.11)  

$$S_{k} = \frac{1}{2}(1-\eta)(1-\xi^{2})$$

$$S_{l} = \frac{1}{2}(1+\xi)(1-\eta^{2})$$

$$S_{o} = \frac{1}{2}(1+\eta)(1-\xi^{2})$$

$$S_{p} = \frac{1}{2}(1-\xi)(1-\eta^{2})$$

## 5.3 Linear triangular elements

![](_page_25_Figure_4.jpeg)

FIGURE 5.7 A triangular element.

$$T^{(e)} = a_1 + a_2 X + a_3 Y \qquad \text{(125)} \qquad \text{Herefore} \qquad \text{(5.12)}$$

$$T = T_i \quad \text{at } X = X_i \text{ and } Y = Y_i$$

$$T = T_j \quad \text{at } X = X_j \text{ and } Y = Y_j$$

$$T = T_k \quad \text{at } X = X_k \text{ and } Y = Y_k$$

$$\Rightarrow T_{i} = a_{1} + a_{2}X_{i} + a_{3}Y_{i}$$
(5.14)
$$T_{j} = a_{1} + a_{2}X_{j} + a_{3}Y_{j}$$

$$T_k = a_1 + a_2 X_k + a_3 Y_k$$

Solving for  $a_1$ ,  $a_2$ , and  $a_3$ , we obtain

$$a_{1} = \frac{1}{2A} [(X_{j}Y_{k} - X_{k}Y_{j})T_{i} + (X_{k}Y_{i} - X_{i}Y_{k})T_{j} + (X_{i}Y_{j} - X_{j}Y_{i})T_{k}]$$
(5.15)

$$a_{2} = \frac{1}{2A} [(Y_{j} - Y_{k}) T_{i} + (Y_{k} - Y_{i}) T_{j} + (Y_{i} - Y_{j}) T_{k}]$$

$$a_{3} = \frac{1}{2A} [(X_{k} - X_{j}) T_{i} + (X_{i} - X_{k}) T_{j} + (X_{j} - X_{ji}) T_{k}]$$

where A is the area of the triangular element and is computed from the equation

$$2A = X_{i}(Y_{j} - Y_{k}) + X_{j}(Y_{k} - Y_{i}) + X_{k}(Y_{i} - Y_{j})$$

(5.16)

Substituting for  $a_1, a_2$ , and  $a_3$  into Eq.(5.12) and grouping  $T_i, T_j$ , and  $T_k$  terms yields

$$T^{(e)} = [S_i \ S_j \ S_k] \begin{pmatrix} T_i \\ T_j \\ T_k \end{pmatrix}$$
 (5.17)

where the shape functions  $S_i, S_j$ , and  $S_k$  are

$$S_i = \frac{1}{2A}(\alpha_i + \beta_i X + \delta_i Y)$$

(5.18)

$$S_{j} = \frac{1}{2A}(\alpha_{j} + \beta_{j}X + \delta_{j}Y)$$

$$S_k = \frac{1}{2A} (\alpha_k + \beta_k X + \delta_k Y)$$

and

$$\begin{aligned} &\alpha_i = X_j Y_k - X_k Y_j & \beta_i = Y_j - Y_k & \delta_i = X_k - X_j \\ &\alpha_j = X_k Y_i - X_i Y_k & \beta_j = Y_k - Y_i & \delta_j = X_i - X_k \\ &\alpha_k = X_i Y_j - X_j Y_i & \beta_k = Y_i - Y_j & \delta_k = X_j - X_i \end{aligned}$$

$$S_i + S_j + S_k = 1$$

(5.19)

Natural(Area) Coordinates for Triangular Elements

![](_page_27_Figure_0.jpeg)

FIGURE 5.8 Natural (area) coordinates for a triangular element.

$$\xi = \frac{A_1}{A}$$

$$\eta = \frac{A_2}{A}$$

$$\lambda = \frac{A_3}{A}$$

$$(5.20)$$

It is important to realize that only two of the natural coordinates are linearly independent, because

$$\frac{A_1}{A} + \frac{A_2}{A} + \frac{A_3}{A} = \frac{A}{A} = 1 = \xi + \eta + \lambda$$

For example, the  $\lambda$ -coordinate can be defined in terms of  $\xi$  and  $\eta$  by

$$\lambda = 1 - \xi - \eta$$

(5.21)

We can show that the triangular natural(area) coordinates are exactly identical to the shape functions ...

$$\xi = S_i$$

$$\eta = S_j$$

$$\lambda = S_k$$
(5.22)

Consider  $\xi$ , which is the ratio of  $A_1$  to A:

$$\xi = \frac{A_1}{A} = \frac{\frac{1}{2}[(X_j Y_k - X_k Y_j) + X(Y_j - Y_k) + Y(X_k - X_j)]}{\frac{1}{2}[X_i (Y_j - Y_k) + X_j (Y_k - Y_i) + X_k (Y_i - Y_j)]}$$

(5.23)

Comparison of Eq.(5.23) to Eq.(5.18) shows that  $\xi$  and  $S_i$  are identical.

#### 5.4 Quadratic triangular elements

![](_page_28_Figure_4.jpeg)

FIGURE 5.9 A quadratic triangular element.

The spatial variation of a dependent variable, such as temperature, over a region may be approximated more accurately by a quadratic function, such as:

$$T^{(e)} = a_1 + a_2 X + a_3 Y + a_4 X^2 + a_5 X Y + a_6 Y^2$$

$$23 - 3 - 3 - 3 - 3 - 3 - 3 - 3 - 3 - 3 -$$

The shape functions in terms of natural coordinates are :

(5.25) 
$$S_{i} = \xi (2\xi - 1)$$

$$S_{j} = n (2n - 1)$$

$$S_{k} = \lambda (2\lambda - 1) = 1 - 3 (\xi + n) + 2 (\xi + n)^{2}$$

$$S_{l} = 4 \xi n$$

$$S_{m} = 4\xi \lambda = 4n (1 - \xi - n)$$

$$S_{n} = 4\xi \lambda = 4\xi (1 - \xi - n)$$

## 長期間中 日本. 5.5 Isoparametric elements

![](_page_29_Figure_4.jpeg)

FIGURE 5.12 A quadrilateral element used in formulating plane-stress problems.

Using a quadrilateral element, the displacement fild within an element belonging to this solid body can be expressed in terms of its nodal values as:

(5.27) 
$$u = S_{i}U_{ix} + S_{j}U_{jx} + S_{m}U_{mx} + S_{n}U_{nx}$$
$$v = S_{i}U_{iy} + S_{i}U_{iy} + S_{m}U_{my} + S_{n}U_{ny}$$

in matrix form

$$\begin{pmatrix} u \\ v \end{pmatrix} = \begin{bmatrix} S_{i} & 0 & S_{j} & 0 & S_{m} & 0 & S_{n} & 0 \\ 0 & S_{i} & 0 & S_{j} & 0 & S_{m} & 0 & S_{n} \end{bmatrix} \begin{pmatrix} U_{ix} \\ U_{iy} \\ U_{jx} \\ U_{jy} \\ U_{mx} \\ U_{my} \\ U_{nx} \\ U_{ny} \end{pmatrix}$$
 (5.28)

Note that using sioparametric formulation, we can the same shape functions to describe the position of any point within the element by the equations

(5.29) 
$$x = S_{i}x_{i} + S_{j}x_{j} + S_{m}x_{m} + S_{n}x_{n}$$
$$y = S_{i}y_{i} + S_{i}y_{j} + S_{m}y_{m} + S_{n}y_{n}$$

...shape function ... Using the chain rule ...

$$\frac{\partial f(x,y)}{\partial \xi} = \frac{\partial f(x,y)}{\partial x} \frac{\partial x}{\partial \xi} + \frac{\partial (x,y)}{\partial y} \frac{\partial y}{\partial \xi}$$

$$\frac{\partial f(x,y)}{\partial n} = \frac{\partial f(x,y)}{\partial x} \frac{\partial x}{\partial n} + \frac{\partial (x,y)}{\partial y} \frac{\partial y}{\partial n}$$
(5.30)

in matrix form...

$$\begin{pmatrix}
\frac{\partial f(x, y)}{\partial \xi} \\
\frac{\partial f(x, y)}{\partial \eta}
\end{pmatrix} = \begin{bmatrix}
\frac{\partial x}{\partial \xi} & \frac{\partial y}{\partial \xi} \\
\frac{\partial x}{\partial \eta} & \frac{\partial y}{\partial \eta}
\end{bmatrix} \begin{pmatrix}
\frac{\partial f(x, y)}{\partial x} \\
\frac{\partial f(x, y)}{\partial y}
\end{pmatrix}$$
(5.31)

where the J matrix is referred to as the Jacobian of the coordinate transformation.

$$\begin{pmatrix} \frac{\partial f(x, y)}{\partial x} \\ \frac{\partial f(x, y)}{\partial y} \end{pmatrix} = [J]^{-1} \begin{pmatrix} \frac{\partial f(x, y)}{\partial \xi} \\ \frac{\partial f(x, y)}{\partial \eta} \end{pmatrix}$$

(5.32)

5.6 Two - Dimensional integrals : Gauss - Legendre

$$I = \int_{-1}^{1} \int_{-1}^{1} f(\xi, \eta) d\xi d\eta \cong \int_{-1}^{1} \left[ \sum_{i=1}^{n} w_{i} f(\xi_{i}, \eta) \right] d\eta \cong \sum_{i=1}^{n} \sum_{j=1}^{n} w_{i} w_{j} f(\xi_{i}, \eta_{j})$$

E14) Given: t= 1/6 m. E=29×106 1b/an2 fin on Find: 201. h, w as the speeds boundary Condition = an =0 4= AE = 15-29 · (106) = 9.06et ×106 kt) = 0.9005 | C3 = \$\frac{1}{29} = 453/25×106  $\begin{bmatrix} k_1+2k_2 & -2k_2 \\ -2k_2 & 2k_2+k_3 & -k_3 \end{bmatrix} \begin{bmatrix} u_3 \\ u_5 \end{bmatrix} = \begin{cases} 0 \\ 0 \\ 0 \end{cases}$   $\begin{bmatrix} 0 \\ -k_3 \end{bmatrix} \begin{bmatrix} k_3 \\ k_4 \end{bmatrix} \begin{bmatrix} u_4 \\ -k_5 \end{bmatrix} \begin{bmatrix} u_5 \\ u_6 \end{bmatrix} = \begin{cases} 0 \\ 0 \\ 0 \end{bmatrix}$ M=0, W= & DDAX10-5 Th, U3 = 1.291 ×10-4 Th, U4 = 1.062 ×10-4 Th. Ro = br he = (9.0625) (106) (8.828)(16-5) = 200.0215 16. - by = 2660 PST. Wast. 1,324 × 10-3 Th. 6, = 5. (uz-uy) = (29)(8.828)(10) = 240.12 psi, be=(29)(5:91-0.888)(10)

## Chapter 8 Analysis of Two-Dimensional Solid Mechanics Problems

## 8.1 Torsion of Members with Arbitrary Cross-Section Shape

Figure 8.1 ... ...

Over the elastic limit, the shear stress distribution within a member with a Grewlar cross section, such as a shaft or a tube,

$$\tau = \frac{Tr}{J}$$

T: torque

Torsion constant

= polar moment of wherfa

(8.1)

for cross-section only
\ni 2420323 324 Thin-walled beam)

r: radial distance measured from the center of the shaft to a desired point in the cross section

J: polar moment of inertia of the cross-sectional area.

Angle of twist caused by the applied torque can be determined from the equation

$$\Theta = \frac{TL}{IG} \tag{8.2}$$

L: length of the member

G: shear modulus of the material

The maximum shearing stress and an angle of twist caused by the torque are given by

Figure 8.2 ... ...

$$\tau_{\max} = \frac{T}{c_1 w h^2}$$

(8.3)

$$\Theta = \frac{TL}{c_2 G W h^3}$$

(8.4)

![](_page_32_Picture_20.jpeg)

여기서  $c_1, c_2$  는 (W/h)에 의해서 결정되는 값으로 Table 8.1 에 나타나 있다.

The maximum shear stress and the angle o twist for cross-sectional geometries with high aspect rations (w/h > 10) are given by:

$$\tau_{\text{max}} = \frac{T}{0.333 w h^2}$$

(8.5)

$$\Theta = \frac{TL}{0.333 \, Gwh^3} \tag{8.6}$$

#### Finite Element Formulation of Torsional Problems

Fung(1965) discusses the elastic torsional behavior of noncircular shafts in detail. There are two basic theories: (1) St. Venant's formulation and (2) the Pranct formulation. Here, we will use the Pranct formulation. The governing differential equation for the elastic torsion of a shaft in terms of the stress function  $\Phi$  is

$$\frac{\partial^2 \Phi}{\partial x^2} + \frac{\partial^3 \Phi}{\partial y^2} + 2G\Theta = 0 \tag{8.7}$$

and

$$\tau_{zx} = \frac{\partial \Phi}{\partial y}$$

$$\tau_{zy} = -\frac{\partial \Phi}{\partial x}$$
(8.8)

(8.9)

Applied torque is related to stress function and is

$$T = 2 \int_{A} \Phi \, dA \tag{8.10}$$

Eq.(8.7)와 Eq.(7.8) 같은 형태임을 알 수있다. 그러므로 section 7.2 and section 7.3 의 결과를 torsional 문제에 적용할 수있다.

we let  $c_1=1$  and  $c_2=1$ ,  $c_3=2G\Theta$ . The stiffness matrix for a rectangular element then becomes

$$[K]^{(e)} = \frac{w}{6l} \begin{bmatrix} 2 & -2 & -1 & 1 \\ -2 & 2 & 1 & -1 \\ -1 & 1 & 2 & -2 \\ 1 & -1 & -2 & 2 \end{bmatrix} + \frac{l}{6w} \begin{bmatrix} 2 & 1 & -1 & -2 \\ 1 & 2 & -2 & -1 \\ -1 & -2 & 2 & 1 \\ -2 & -1 & 1 & 2 \end{bmatrix}$$

(8.11)

1 2

where w and is are the length and the width, respectively, of the rectangular element, as shown in Figure 8.4. The load matrix for an element is

$${F}^{(e)} = \frac{2G\Theta A}{4} \begin{bmatrix} 1\\1\\1 \end{bmatrix}$$

(8.12)

and for triangular elements, shown in Figure 8.5, the stiffness and load matrices are

$$[K]^{(e)} = \frac{1}{4A} \begin{bmatrix} \beta_i^2 & \beta_i \beta_j & \beta_i \beta_k \\ \beta_i \beta_j & \beta_j^2 & \beta_j \beta_k \\ \beta_i \beta_k & \beta_i \beta_k & \beta_k^2 \end{bmatrix} + \frac{1}{4A} \begin{bmatrix} \delta_i^2 & \delta_i \delta_j & \delta_i \delta_k \\ \delta_i \delta_j & \delta_j^2 & \delta_j \delta_k \\ \delta_i \delta_k & \delta_j \delta_k & \delta_k^2 \end{bmatrix}$$
(8.13)

$$\{F\}^{(e)} = \frac{2G\Theta A}{3} \begin{pmatrix} 1\\1\\1 \end{pmatrix}$$

(8.14)

where the area A of the triangular element and the  $\alpha$ ,  $\beta$ , and  $\delta$ -terms are given by :

$$\begin{split} 2A &= X_i (Y_j - Y_k) + X_j (Y_k - Y_i) + X_k (Y_i - Y_j) \\ \mathfrak{a}_i &= X_j Y_k - X_k Y_j & \beta_i &= Y_j - Y_k & \delta_i &= X_k - X_j \\ \mathfrak{a}_j &= X_k Y_i - X_i Y_k & \beta_j &= Y_k - Y_i & \delta_j &= X_i - X_k \\ \mathfrak{a}_k &= X_i Y_j - X_j Y_i & \beta_k &= Y_i - Y_j & \delta_k &= X_j - X_i \end{split}$$

### 8.2 Beams and Frames

Figure 8.6 ... ...

the flexure formula is the equation

$$\sigma = -\frac{My}{I} \tag{8.15}$$

The deflection of the neutral axis v is also related to the internal bending moment M(x), the transverse shear V(x), and the load w(x) according to the equations

$$EI \frac{d^2v}{dx^2} = M(x) \tag{8.16}$$

$$EI\frac{d^3v}{dx^3} = \frac{dM(x)}{dx} = V(x)$$

$$EI\frac{d^4v}{dx^4} = \frac{dV(x)}{dx} = w(x) \tag{8.18}$$

## Finite Element Formulation

In the following derivation, we will neglect the contribution of shear stresses to the strain energy. The strain energy for an arbitrary beam element(e) then becomes

$$\Lambda^{(e)} = \int_{V} \frac{\sigma \varepsilon}{2} dV = \int_{V} \frac{E \varepsilon^{2}}{2} dV = \frac{E}{2} \int_{V} (-y \frac{d^{2} v}{dx^{2}})^{2} dV \tag{2.19}$$

$$\Lambda^{(e)} = \frac{E}{2} \int_{V} (-y \frac{d^{2}v}{dx^{2}})^{2} dV = \frac{E}{2} \int_{0}^{L} (\frac{d^{2}v}{dx^{2}})^{2} dx \int_{A} y^{2} dA$$

(8.20)

Recognizing the integral  $\int_A y^2 dA$  as the second moment of the area I, we have :

$$\Lambda^{(e)} = \frac{EI}{2} \int_0^L (\frac{d^2v}{dx^2})^2 dx$$
 (8.31)

Figure 8.7 ... ...

the third-order polynomial

$$v = c_1 + c_2 x + c_3 x^2 + c_4 x^3 : \text{ IT ATSON } 3550$$

The element's end conditions are given by the following nodal values:

For node i: The vertical displacement at x=0  $v=c_1=U_{i1}$ 

For node 
$$i$$
: The slope at  $x=0$   $\frac{dv}{dx} \mid_{x=0} = C_2 = U_{i2}$ 

For node j: The vertical displacement at x = L  $v = c_1 + c_2 L + c_3 L^2 + c_4 L^3 = U_A$ 

For node 
$$j$$
: The slope at  $x=L$   $\frac{dv}{dx}\mid_{x=L}=c_2+2c_3L+3c_4L^2=U_{j2}$ 

we now have four equations with four unknowns. Solving for  $c_1$ ,  $c_2$ ,  $c_3$ , and  $c_4$  substituting into Eq.(8.22); and regrouping the  $U_{il}$ ,  $U_{il}$ ,  $U_{il}$ ,  $U_{il}$ -terms results in the equation

$$v = S_{i1}U_{i1} + S_{i2}U_{i2} + S_{j1}U_{j1} + S_{j2}U_{j2}$$

(8.23)

where the shape functions are given by

$$S_{i1} = 1 - \frac{3x^2}{L^2} + \frac{2x^3}{L^3}$$

(8.24)

$$S_2 = x - \frac{2x^2}{L} + \frac{x^3}{L^2} \tag{8.25}$$

$$S_{A} = \frac{3x^{2}}{L^{2}} - \frac{2x^{3}}{L^{3}} \tag{8.26}$$

$$S_{2} = -\frac{x^{2}}{L} + \frac{x^{3}}{L^{2}} \tag{8.27}$$

node 
$$i$$
 at  $x=0$   $\Rightarrow$   $S_{i1}=1$  and  $S_{i2}=S_{i1}=S_{i2}=0$   
slope at  $x=0$   $\Rightarrow$   $\frac{dS_{i2}}{dx}=1$  and  $\frac{dS_{i1}}{dx}=\frac{dS_{i1}}{dx}=\frac{dS_{i2}}{dx}=0$   
node  $j$  at  $x=L$   $\Rightarrow$   $S_{j1}=1$  and  $S_{i1}=S_{i2}=S_{i2}=0$   
slope at  $x=L$   $\Rightarrow$   $\frac{dS_{i2}}{dx}=1$  and  $\frac{dS_{i1}}{dx}=\frac{dS_{i2}}{dx}=\frac{dS_{i1}}{dx}=0$ 

These values are the properties of the Hermite third-order polynomials.

Eq.(8.21) ... substitute for the displacement field v in terms of the shape functions and nodal values.

$$\frac{d^2v}{dx^2} = \frac{d^2}{dx^2} [S_{i1} \ S_{i2} \ S_{j1} \ S_{j2}] \begin{pmatrix} U_{i1} \\ U_{i2} \\ U_{j1} \\ U_{j2} \end{pmatrix}$$
(3.28)

Let the second derivatives of the shape functions be defined terms of the following relationships:

$$D_{i1} = \frac{d^2S_{i1}}{dx^2}$$

$$D_{i2} = \frac{d^{2}S_{i2}}{dx^{2}}$$

$$D_{j1} = \frac{d^{2}S_{j1}}{dx^{2}}$$

$$D_{j22} = \frac{d^{2}S_{j2}}{dx^{2}}$$

Then. Eq.(8.28) takes on the compact-matrix form of

$$\frac{d^2v}{dx^2} = [D]\{U\} \tag{8.29}$$

The  $(\frac{d^2v}{dx^2})^2$  term can be represented in terms of the  $\{U\}$  and [D] matrices as

$$\left(\frac{d^2v}{dx^2}\right)^2 = \{U\}^T [D]^T [D] \{U\} \tag{8.30}$$

Thus, the strain energy for an arbitrary beam element is

$$\Lambda^{(e)} = \frac{EI}{2} \int_{0}^{L} \{U\}^{T} [D]^{T} [D] \{U\} dx$$
 (6.31)

potential energy ... ...

$$\Pi = \sum \Lambda^{(e)} - \sum FU \tag{8.39}$$

minimum total potential energy  $\dots$  of or a beam element  $\dots$   $\dots$ 

$$\frac{\partial \prod}{\partial U_k} = \frac{\partial}{\partial U_k} \sum \Lambda^{(e)} - \frac{\partial}{\partial U_k} \sum FU = 0 \quad \text{for } k = 1, 2, 3, 4$$

(8.33)

The strain energy part of the total potential energy ... ...

$$\frac{\partial \Lambda^{(e)}}{\partial U_k} = EI \int_0^L [D]^T [D] dx \{U\}$$
(2.36)

Evaluating Eq.(8.34) leads to the expression

$$\frac{\partial \Lambda^{(e)}}{\partial U_k} = EI \int_0^L [D]^T [D] dx \{U\} = \frac{EI}{L^3} \begin{bmatrix} 12 & 6L & -12 & 6L \\ 6L & 4L^2 & -6L & 2L^2 \\ -12 & -6L & 12 & -6L \\ 6L & 2L^2 & -6L & 4L^2 \end{bmatrix} \begin{bmatrix} U_{i1} \\ U_{i2} \\ U_{j1} \\ U_{j2} \end{bmatrix}$$

the stiffness matrix for a beam element with two degrees of freedom at each node the vertical displacement and rotation-is

$$[K]^{(e)} = \frac{EI}{L^3} \begin{bmatrix} 12 & 6L & -12 & 6L \\ 6L & 4L^2 & -6L & 2L^2 \\ -12 & -6L & 12 & -6L \\ 6L & 2L^2 & -6L & 4L^2 \end{bmatrix}$$
(8.35)

#### Load Matrix

There are two ways ... ...

- (1) by minimizing the work done by the load
- (2) by computing the beam's reaction forces

Let us develop the load matrix using the alternate approach, starting with Eq.(8.18)

$$EI\frac{d^4v}{dx^4} = \frac{dV(x)}{dx} = w(x)$$

For a uniformly distributed load, w(x) is constant. Integrating this equation

$$EI - \frac{d^3v}{dx^3} = -wx + c_1 \tag{8.36}$$

Applying the boundary condition  $EI\frac{d^3v}{dx^3}\mid_{x=0}=R_1$ , we find that  $c_1=R_1$ Substituting for the value of  $c_1$  and integrating again ...

$$EI\frac{d^2v}{dx^2} = -\frac{wx^2}{2} + R_1x + c_2$$

(8.37)

Applying the boundary condition  $EI\frac{d^2v}{dx^2}\mid_{x=0}=-M_1$ , we find that  $c_2=-M_1$ 

Substituting for the value of  $c_2$  and integrating ...

$$EI\frac{dv}{dx} = -\frac{wx^3}{6} + \frac{R_1x^2}{2} - M_1x + c_3$$

(8.38)

Applying the boundary condition  $\frac{dv}{dx} \mid_{x=0} = 0$ , we find that . Integrating ...

$$EIv = -\frac{wx^4}{24} + \frac{R_1x^3}{6} - \frac{M_1x^2}{2} + c_4$$

(8.39)

Applying the boundary condition v(0)=0 ,we determine that  $c_4=0$ , and apply two additional boundary conditions  $\frac{dv}{dx}\mid_{x=L}=0$  and v(L)=0.

$$\frac{dv}{dx} \mid_{x=L} = -\frac{wL^3}{6} + \frac{R_1L^2}{2} - M|_1L = 0$$
(8.40)
$$v(L) = -\frac{wL^4}{24} + \frac{R_1L^3}{6} - \frac{M_1L^2}{2} = 0$$
(8.41)

Solving these equations ....

$$R_1 = R_2 = \frac{wL}{2}$$
 $M_1 = M_2 = \frac{wL^2}{12}$ 

## Frames

Figure 8.11 ... ...

The local degrees of freedom are related to the global degrees of freedom through the transformation matrix, according to the relationship

$$[u] = [T][U]$$
 (8.43)

where the transformation matrix is

$$[T] = \begin{bmatrix} \cos\theta & \sin\theta & 0 & 0 & 0 & 0 \\ -\sin\theta & \cos\theta & 0 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 & 0 & 0 \\ 0 & 0 & 0 & \cos\theta & \sin\theta & 0 \\ 0 & 0 & 0 & -\sin\theta & \cos\theta & 0 \\ 0 & 0 & 0 & 0 & 0 & 1 \end{bmatrix}$$

(8.44)

stiffness matrix ... ...

$$[K]^{(e)} = \frac{EI}{L^3} \begin{bmatrix} 0 & 0 & 0 & 0 & 0 & 0 \\ 0 & 12 & 6L & 0 & -12 & 6L \\ 0 & 6L & 4L^2 & 0 & -6L & 2L^2 \\ 0 & 0 & 0 & 0 & 0 & 0 \\ 0 & -12 & -6L & 0 & 12 & -6L \\ 0 & 6L & 2L^2 & 0 & -6L & 4L^2 \end{bmatrix} \begin{array}{c} u_{i1} \\ u_{i2} \\ u_{i3} \\ u_{i4} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{i5} \\ u_{$$

(8.45)

$$[K]_{axial}^{(e)} = \begin{bmatrix} \frac{AE}{L} & 0 & 0 & -\frac{AE}{L} & 0 & 0 \\ 0 & 0 & 0 & 0 & 0 & 0 \\ 0 & 0 &$$

(8.46)

Adding Eqs.(8.45) and (8.46) results in the stiffness matrix for a frame element:

$$[K]_{xy}^{(e)} = \begin{bmatrix} \frac{AE}{L} & 0 & 0 & -\frac{AE}{L} & 0 & 0\\ 0 & \frac{12EI}{L^3} & \frac{6EI}{L^2} & 0 & -\frac{12EI}{L^3} & \frac{6EI}{L^2}\\ 0 & \frac{6EI}{L^2} & \frac{4EI}{L} & 0 & -\frac{6EI}{L^2} & \frac{2EI}{L}\\ -\frac{AE}{L} & 0 & 0 & \frac{AE}{L} & 0 & 0\\ 0 & -\frac{12EI}{L^3} & \frac{6EI}{L^2} & 0 & \frac{12EI}{L^3} & -\frac{6EI}{L^2}\\ 0 & \frac{6EI}{L^2} & \frac{2EI}{L} & 0 & -\frac{6EI}{L^2} & \frac{4EI}{L} \end{bmatrix}$$

\* 异社 日工性 7把 개恒

o 241 343 f :

Minimum total potental energy formulation

$$T = \frac{1}{2\pi} \Lambda^{(e)} - \frac{1}{2\pi} F_{rur} : total potential energy$$

$$\frac{1}{2\pi} \Lambda^{(e)} - \frac{1}{2\pi} F_{rur} = \frac{1}{2\pi} \frac{1}{2\pi} \Lambda^{(e)} - \frac{1}{2\pi} \frac{1}{2\pi} F_{rur} = 0$$

$$\frac{1}{2\pi} \Lambda^{(e)} = \frac{1}{2\pi} \frac{1}{2\pi} \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi} \right) \left( \frac{1}{2\pi} - \frac{1}{2\pi}$$

- Direct formulation of select stables.

exact sol.: Action—psolval formulation, Bortest errors 리아 이 되도록 하는 방법\nexact sol.: Action—psolval = 가다 放介 도기

① 即時刊: 以外 对个社会时 对时代 R=O, ex) Rcgy) === 0, Rcgy) ===== 0, Rcgy) ====================================

日村田村: A明刊 中野中の村 7時日 0 , 00 1 Februs -0 autodematin method.

田 対対 財報: オヤネイ ゆっつ 30 ex Jo P R dy

60 10 R (025-0-1254) 20 dy=0.

2. Trusses Compression & tension by DDf.

The Use wix cos  $\theta$  - the sind

Uy = Ux sin  $\theta$  + the cos  $\theta$ . Uze = uze cos 0 - uzy sino Usy= use Sind + dry cost  $\begin{array}{c|ccccccccccccccccccccccccccccccccccc$  $-\frac{1}{4} k^{(4)} = \begin{bmatrix} k & 0 & + & 0 \\ 0 & 0 & 0 \\ -k & 0 & k & 0 \end{bmatrix}$ 1+4 = [K] fug, K= [k k]  $k^{(e)} = TKT' = k$ 

Chapter 3. One-Dimensional Elements

## 1. Linear Flements

$$G_{1} = \frac{x - x_{1}}{x_{1} - x_{2}} = \frac{x - x_{1}}{x_{1}} = \frac{x - x_{1}}{x_{2}} = \frac{x - x_{1}}{x_{2}} = \frac{x - x_{2}}{x_{2}}$$

## 2. Quartrotic elements

· Shape function.

$$G_{1} = \begin{pmatrix} x - x_{1} \\ x - x_{2} \end{pmatrix} \begin{pmatrix} x - x_{2} \\ x - x_{3} \end{pmatrix} = \frac{2}{\ell^{2}} (x - x_{3}) (x - x_{k})$$

$$G_{2} = \begin{pmatrix} x - x_{1} \\ x - x_{2} \end{pmatrix} \begin{pmatrix} x - x_{k} \\ x - x_{3} \end{pmatrix} = \frac{2}{\ell^{2}} (x - x_{3}) (x - x_{k})$$

$$G = \left(\frac{x - x_1}{x_1 - x_1}\right) \left(\frac{x - x_2}{x_1 - x_1}\right) = \frac{2}{L^2} (x - x_1)(x - x_2)$$

$$S_{k} = \left(\frac{x - x_{1}}{x_{k} - x_{1}}\right) \left(\frac{x - x_{2}}{x_{k} - x_{2}}\right) = -\frac{4}{k!} (x - x_{1})(x - x_{2})$$

## 3. Cubic element

$$G_{i} = \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} = -\frac{9}{2l^{3}} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}} \end{pmatrix} \begin{pmatrix} \frac{X-X_{i}}{X_{i}$$

4. Global, Local, Natural Coordinates

- linear shape fanotion
$$S_1 = \frac{X_1 - X_2}{J}$$
of the X = X\_1 + X\_2.

$$=\frac{1-\alpha}{1}=(1-\frac{\alpha}{1}).$$

$$G = \frac{X - X_{1}}{L} = \begin{pmatrix} x \\ L \end{pmatrix}$$

$$\xi = \frac{2\pi}{L} - 1$$

$$= \frac{1}{2}(\xi + 1)$$

- quadratic natural shape function

$$G_{i} = \left(\frac{X - X_{i}}{X_{i} - X_{k}}\right) \left(\frac{X - X_{k}}{X_{i} - X_{k}}\right) = \frac{2}{L^{2}} \left(X - X_{i}\right) \left(X - X_{k}\right) = \frac{2}{L^{2}} \left(X - L\right) \left(X - \frac{L}{2}\right)$$

$$G = \left(\frac{X-X_{1}}{X_{2}-X_{1}}\right)\left(\frac{X-X_{2}}{X_{2}-X_{1}}\right) = \frac{2}{\ell^{2}}\left(X-X_{1}\right)\left(X-X_{2}\right) = \frac{2}{\ell^{2}}\cdot \chi\cdot\left(\chi-\frac{1}{2}\right)$$

$$S_{7} = \frac{2}{3}(1-\frac{2}{3})(\frac{1}{2}-\frac{2}{3}) = 2\cdot\frac{1}{3}(1-\frac{2}{3})(\frac{1}{3}+\frac{1}{3}(1-\frac{2}{3})) = -\frac{1}{3}(1-\frac{2}{3})$$
  
 $S_{7} = \frac{1}{3}(1+\frac{2}{3})(\frac{1}{2}-\frac{2}{3}) = 2\cdot\frac{1}{3}(1-\frac{2}{3})(\frac{1}{3})$   
 $S_{7} = \frac{1}{3}(1+\frac{2}{3})(\frac{1}{3}-\frac{2}{3})(\frac{1}{3}-\frac{2}{3})(\frac{1}{3})$   
 $S_{7} = \frac{1}{3}(1+\frac{2}{3})(\frac{1}{3}-\frac{2}{3})(\frac{1}{3}-\frac{2}{3})(\frac{1}{3}-\frac{2}{3})(\frac{1}{3})$ 

or 
$$S_{1} = \left(\frac{3-3}{5}\right)\left(\frac{3-5}{5}\right)\left(\frac{3-5}{5}\right) = +\frac{(3-1)}{2}3 = -\frac{1}{2}3(-5)$$

$$5 = (\frac{3-3}{5} - \frac{3}{5})(\frac{3-3k}{3-3k}) = \frac{1}{2}5(1+5)$$

$$S_{1c} = \left(\frac{5-5}{5}-\frac{5}{5}\right)\left(\frac{5-5}{5}-\frac{5}{5}\right) = (1+5)(1-5)$$

# the natural I-D apric shape function.

$$G = \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right) \left(\frac{5-5}{5-5}\right)$$

$$= \frac{9}{16} (H5) (1-5)(35+1)$$

5. Gauss - Legendre Quadrature  $I = \int_a^b f(x) dx = \sum_{i=1}^b W_i f(x_i^i).$ 

Gay. 
$$\alpha = c_0 + q$$

$$\alpha = c_0 + q(-1)$$

$$b = c_0 + q(1)$$

$$\Rightarrow \alpha = \frac{a+b}{2} + \frac{b-a}{2}$$

$$d\alpha = \frac{b-a}{2}$$

$$d\alpha = \frac{b-a}{2}$$

$$J = \int_{-1}^{1} f \varphi_{1} dx = \sum_{j=1}^{n} \omega_{i} f \varphi_{i}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} 1 dx = 2 = \omega_{1} + \omega_{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma dy = 0 = \omega_{1} \gamma_{1} + \omega_{2} \gamma_{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{2} dy = \frac{2}{3} = \omega_{1} \gamma_{1}^{2} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{2} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{2} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{1} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{2} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{2} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{2} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} \gamma_{2}^{2}$$

$$\omega_{2} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{1} + \omega_{2} f \varphi_{2} = \int_{-1}^{1} \gamma^{3} dy = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{2} + \omega_{3} f \varphi_{2} = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{2} + \omega_{3} f \varphi_{2} = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{2} + \omega_{3} f \varphi_{2} = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{3} + \omega_{3} f \varphi_{2} = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{2}^{2}$$

$$\omega_{3} f \varphi_{3} + \omega_{3} f \varphi_{3} + \omega_{3} f \varphi_{3}^{2} = 0 = \omega_{1} \gamma_{1}^{3} + \omega_{2} f \varphi_{3}^{2}$$

# diapter 5. Two-Dimensional Elements

1. Rectangular Elements.

$$S_{1} = \left(\frac{\chi - l}{L}\right)\left(\frac{1 - w}{w}\right) = \left(1 - \frac{\chi}{L}\right)\left(1 - \frac{\chi}{w}\right)$$

$$C_{2} = \left(\frac{\chi - l}{L}\right)\left(\frac{1 - w}{w}\right) - \chi\left(\frac{1 - w}{L}\right)$$

$$S = -\left(\frac{\chi}{\ell}\right)\left(\frac{y-\omega}{\omega}\right) = \frac{\chi}{\ell}\left(1-\frac{y}{\omega}\right)$$

$$S_{\mathbf{m}} = \left(\frac{\chi}{l}\right)\left(\frac{y}{\omega}\right) = \frac{\chi y}{l\omega}$$

$$S_n = -\left(\frac{\chi - \ell}{\ell}\right)\left(\frac{1}{\ell}\right) = \frac{\chi}{\ell}\left(1 - \frac{\chi}{\ell}\right)$$

$$S_{1} = \begin{pmatrix} 3 - 3_{1} \\ \hline 3_{1} - 5_{1} \end{pmatrix} \begin{pmatrix} 1 - 0_{1} \\ \hline 0_{1} - 0_{1} \end{pmatrix} = \begin{pmatrix} 5 + \\ -2 \end{pmatrix} \begin{pmatrix} 1 + \\ -2 \end{pmatrix} = \pm (1 - 5)(1 - 4)$$

$$S_{j} = \left(\frac{3-(37)}{(37)-(37)}\right) = \left(\frac{3+1}{2}\right)\left(\frac{1-1}{2}\right) = \frac{1}{4}(1+5)(1-4)$$

$$S_{m} = \frac{3 - 3n}{3m - 5n} \left( \frac{1 - 05}{2m - 15} \right) = \left( \frac{3+1}{2} \right) \left( \frac{1}{2} \right) = \pm c + c + c + c + c + c + c + c + c + c$$

$$G_{n} = \left(\frac{5}{5} - \frac{5}{5}m\right) \left(\frac{1}{1} - \frac{7}{1}\right) = \left(\frac{5}{7}\right) \left(\frac{7}{7}\right) = \frac{1}{7}(1-5)(1+7)$$

$$S_{m} = F_{r}(S, 9) F_{c}(S, 9)$$
 $F_{1} = (S_{1})(9+1)$ 
 $F_{2} = G_{1} + G_{2}(S_{1} + G_{2})$ 

At point 0: 
$$F_2 = Q + C_3 = 0$$

$$L = F_4 = Q + C_2 = 0$$

$$W = F_4 = Q + C_2 + C_3 = 1$$

$$Q = -1$$

$$C_3 = 1$$

$$F_{2} = -1 + 3 + 9$$

$$-0 \quad S_{m} = \frac{1}{4} (3+1) (9+1) (-1 + 3 + 9)$$

$$S_0 = F_1 F_2$$
  
 $F_1 = (3+1)(3-1)(9+1)$   
 $F_2 = C$ 

$$6.0(0,1) = (1)(1)(2) \cdot C = 1$$
 $C = -\frac{1}{2}$ 

$$:. S_0 = -\frac{1}{2}(5+1)(5-1)(9+1) = \frac{1}{2}(1+5)(1-5)(1+9)$$

$$= \frac{1}{2}(1-5^2)(1+9)$$

2005 년도 항공우주 및 기계공학부 유한요소법 중간고사 시험문제 (Open Book !!!) 시험일시: 2005년 4월 19일 2교시 (10:00 ~ 10:50), 시험장소: 기계관 3층 CAD실

1. 그림에서 보여진 2자유도의 트러스-스프링 시스템에 대해 Total Potential Energy를 구하고,  $u_1$ 과  $u_2$ 에 대해 최소화(변분)과정을 통하여 평형방정식을 구하라.

![](_page_49_Picture_2.jpeg)

2. 다음과 같은 알루미늄 트러스 구조의 **2**점에서의 수평과 수직 변위를 유한요소법을 사용하여 구하라. (E=70GPa, A=15 cm²) **\KN** 

![](_page_49_Picture_4.jpeg)

3. 형상함수의 기본특성을 이용하여 다음 그림과 같은 5절점 일차원 형상함수  $N_1,\ N_2,\ N_3,\ N_4,\ N_5$ 를 구하라.

$$S=-1$$
  $S=-2$   $S=\frac{1}{2}$   $S=1$   $N_1$   $N_2$   $N_4$   $N_5$ 

4. 그림과 같은 8절점 사각형 요소의 원점에서의 형상함수 N1, N2와 N5, N6를 구하시오.

![](_page_49_Picture_8.jpeg)

# OPEN Book!

2002 년도 항공우주 및 기계공학부 유한요소법 중간고사 시험문제 (Open Book !!!) 시험일시 : 2002년 4월 23일 10교시 (18:00 ~ 18:50), 시험장소: 기계관 3층 CAD실

1. 그림에서 보여진 2자유도의 스프링 시스템에 대해 Total Potential Energy를 구하고, ui과 u2에 대해 최소화(변분)과정을 통하여 평형방청식을 구하라.

![](_page_50_Picture_3.jpeg)

2. 다음과 같은 트러스 구조의 수평 변위를 유한요소법을 사용하여 구하라. (E=10x10<sup>6</sup> psi, A=100 in<sup>2</sup>)

![](_page_50_Picture_5.jpeg)

3. 그림과 같은 원점이 1/3지점에 위치를 국부좌표 x를 사용하여 선형요소의 형상함수를 유 도하라.

![](_page_50_Picture_7.jpeg)

4. 그림과 같은 2차원 삼각형요소에서 응력분포가 나타나 있다. x=2.15cm, y=1.1cm에서 웅력

![](_page_50_Figure_9.jpeg)

少年 2部 架 翻 1/3 机则 料整 祥 3年 X元 48年 4时 6时 6时 6时 6时 6时 6时 6时 6时 6时 6时 6时 6时 6时

$$G = \frac{x - \alpha_1}{3 - \alpha_1} = \frac{x + \frac{1}{3}}{1 - \frac{1}{3}} = \frac{x - \frac{3}{3}l}{1 - \frac{1}{3}l} = \frac{2}{3} - \frac{x}{l}$$

$$G = \frac{x - \alpha_1}{3 - \alpha_1} = \frac{x + \frac{1}{3}}{1 - \frac{1}{3}l} = \frac{1}{3} + \frac{x}{l}$$

1. 2种的 里型 2种型 6型 ACEL OF OF OF OF OF OF OF OF OF OF OF OF OF

$$\frac{1}{4} = \frac{1}{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}^{4} \int_{1}$$

## 2004 년도 항공우주 및 기계공학부 유한요소법 중간고사 시험문제 시험일시 : 2004년 5월 3일 5교시 (14:00 ~ 14:50), 시험장소: 기계관 108호

1. 그림과 같은 테이퍼진 봉의 지배방정식과 경계조건은 다음과 같다.

(40점)

$$A(y)E\frac{du}{dy}-P=0, \qquad u(0)=0$$

위식의 근사해를 다음과 같은 2차식으로 가정하였다.

$$\mu(y) = c_0 + c_1 y + c_2 y^2$$

여기서 미지수 $_{_0}c_0$ ,  $c_1$ , $c_2$ 를 가중잔여 함수를 이용하여 다음과 같은 방법을 사용하여 구하시

오. (A) 배열법 ; B) 부영역법 , C) 갤러킨법, D) 최소자승법

![](_page_52_Picture_9.jpeg)

2. 다음과 같이 단면적이  $15 \text{ } cm^2$ 인 알루미늄 합금으로 구성된 트러스 부재가 있다. 유한 요소해석 과정을 거쳐 절점 2와 4의 변위를 구하라. 알루미늄합금의 탄성계수 E=70 GPa이고

경사진 유한요소식은 다음과 같다. (단위 조심!!!! Pa=N/m²)

(30/8)

情報 会社 日子 を中に 「日子 全社!!!! 
$$Pa=N/m$$
 )
$$\begin{pmatrix} F_{ix} \\ F_{iy} \\ F_{jx} \\ F_{jy} \end{pmatrix} = k \begin{pmatrix} \cos^2\theta & \sin\theta\cos\theta & -\cos^2\theta & -\sin\theta\cos\theta \\ \sin\theta\cos\theta & \sin^2\theta & -\sin\theta\cos\theta & -\sin^2\theta \\ -\cos^2\theta & -\sin\theta\cos\theta & \cos^2\theta & \sin\theta\cos\theta \\ -\sin\theta\cos\theta & -\sin^2\theta & \sin\theta\cos\theta & \sin^2\theta \end{pmatrix} \begin{pmatrix} U_{ix} \\ U_{iy} \\ U_{jx} \\ U_{jy} \end{pmatrix}$$

A=·/FX

![](_page_52_Picture_15.jpeg)

5m20=1

.

3. 3점 가우스-르잔드르 적분 공식을 이용하여  $I=\int_2^6 (x^2+5x+3)dx$ 를 구하라. 3점 가우스-르잔드르 구적법의 가중계수  $w_{1=\frac{5}{9}}$ ,  $w_{2=\frac{8}{9}}$ ,  $w_{3}=\frac{5}{9}$ 이고,적분점은  $\lambda_1=-\sqrt{\frac{3}{5}}$ ,  $\lambda_2=0$ ,  $\lambda_3=+\sqrt{\frac{3}{5}}$ 이다. I의 값을 3점 가우스-르잔드르 적분 공식으로 구한 후 미적분학에서 쓰는 일반적 해석 해와 비교하여 몇 %의 정밀도를 갖는 지를 규명하라.

## INSTRUCTIONS to align print cartridges

To get the best print quality, you should align your print cartridges. Follow these steps:

- Step 1. Load the other page face down in the automatic document feeder (ADF).
- Step 2. Press Enter on the control panel when prompted.
- Step 3. "Alignment Complete" displays when you are done. Please recycle or discard these pages.

![](_page_53_Figure_5.jpeg)

## 6. solve

$$\begin{cases} 100.2 = 333(10) \\ 0 \end{cases} \begin{cases} 0.5 \\ 0.5 \end{cases} \begin{cases} 0.5 \\ 0.5 \end{cases}$$

## Prob. 18.

![](_page_54_Figure_8.jpeg)

- 1. Discretize the sol. domain
- 2. Assume a soloution that Tesoo approximates the behavior of

$$f_{i} = k_{eq} c (u_{i} - u_{i+1})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1} = l_{eq} c (u_{i+1} - u_{i})$$

$$f_{i+1$$

$$\begin{array}{cccccccccccccccccccccccccccccccccccc$$

7.311 中化-20世紀 双語

I= 
$$\int_{2}^{6} (x^{2}+5\alpha+3) dx = \left[\frac{x^{3}}{3}+\frac{4x^{2}}{2}+3x\right]_{2}^{6} = 161.333...$$

From Gauss - beginner guadrature.

$$2 = 9 + C_2(1)$$
  $\rightarrow 9 = 4, G=2$   
 $6 = 9 + C_2(1)$ 

$$x = 9 + Gy = 4 + 2$$

$$dx = 3dx$$

$$dx = 2d$$

$$\int \int \int \int dx dx dx dx dx dx dx dx dx dx dx dx dx$$

$$f(71) = f(-1/4) = 42.521$$

$$I=(\frac{1}{9})(42521)+(\frac{1}{9})(18)+(\frac{1}{9})(123.019)=$$

100 % 2945.

## 2001 년도 항공우주 및 기계공학부 유한요소법 중간고사 시험문제 시험일시 : 2001년 4월 25일 5교사 (13:00 - 14:30) 시험장소 2기계관 3층 CAD실

[. 그림에서 보여진 스프링 시스템에 대해 각 전점의 변위를 구하다. 호스의 강성했일을 구 하고, 전체 생활을 구하라. 상계조건과 하중 조산을 부과하고 상징 원립방장식을 들어나 ...

![](_page_56_Picture_2.jpeg)

2. 다음과 같은 트립스 구조의 규명 변위를 유한요소법을 사용하여 구하라 (B=10x10<sup>6</sup> psi, A=100 in<sup>2</sup>)

![](_page_56_Picture_4.jpeg)

3. 그림과 같은 편의 온도 분포를 7차 보<u>간한수를 사용하여 구하라</u> (X-Ucmol A)

![](_page_56_Picture_6.jpeg)

4 )하우 판약 공부·문포를 고백당하기 위해 2개인 시시각형 요소를 사용한다. 관요소의 중앙 에서의 응력은 얼마인가?

![](_page_56_Picture_8.jpeg)

1. 240种 生物 企图 个型 中部 字对照 時代至 产部 医公司 独独思生 产部。 对 对 对 对 对 对 对 对 对 对 对 对 对 对 对 对 对 对 对

40). 
$$k_{1} = \begin{bmatrix} 5 & -5 \\ -5 & 1 \end{bmatrix} \underbrace{u_{1}}_{k_{2}} = \begin{bmatrix} 5 & -6 \\ -6 & 4 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -5 & 1 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \begin{bmatrix} 5 & -6 \\ -13 & 13 \end{bmatrix} \underbrace{u_{2}}_{k_{3}} = \underbrace{b_{1} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2} + b_{2}$$

: 12 - 2 , U3 = 2.169

![](_page_58_Figure_0.jpeg)

![](_page_58_Figure_1.jpeg)

## 1. Discretize

# 2 Assume appression

$$k_{0}^{(1)} = \frac{AE}{L} = \frac{(100)(10)(10^{6})}{(100)(10^{6})} = 2.11/\times10^{9}$$

$$k_{0}^{(2)} = \frac{AE}{L} = \frac{(100)(10)(10^{6})}{(3\sqrt{2})(12)} = 1.596 \times 10^{9}$$

# 3. Develop equation

$$k^{(1)} = k_{2}^{(1)} \cdot \begin{bmatrix} -\cos^{2}\theta & \cos^{2}\theta & -\cos^{2}\theta & -\cos^{2}\theta & -\sin^{2}\theta \\ -\sin^{2}\theta & -\sin^{2}\theta & -\sin^{2}\theta & -\sin^{2}\theta \\ -\cos^{2}\theta & -\sin^{2}\theta & \cos^{2}\theta & \cos^{2}\theta \\ -\sin^{2}\theta & -\sin^{2}\theta & -\sin^{2}\theta & \cos^{2}\theta \end{bmatrix}$$

$$= 2M)(10^{9}) \begin{bmatrix} 1 & 0 & -1 & 0 \\ -1 & 0 & 1 & 0 \\ -1 & 0 & 1 & 0 \end{bmatrix}$$

3. 그런 같은 편의 85분조를 1차 此時代是 1834年 734. (Xstamorth)

$$S_{2} = \frac{1}{X_{2} - X_{3}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} \cdot S_{3} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} = \frac{1}{X_{3} - X_{2}} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3} \cdot S_{3$$

中 部巴 明 是对格兰 经附部 别的 二种的 对对对 经工具 不是对于 连纪

$$S_{m} = \frac{2}{1} \frac{y}{w} = \frac{1}{4}$$

For in the six of the order 
$$x = \frac{1}{2000}$$
  $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{2000}$   $y = \frac{1}{20000}$   $y = \frac{1}{20000}$   $y = \frac{1}{20000}$   $y = \frac{1}{20000}$   $y = \frac{1}{200000}$   $y = \frac{1}{200000000000000000000000000000000000$ 

$$S_{n} = \left(\frac{2-l}{l}\right) \left(\frac{1}{l}\right) - \frac{1}{l}\left(\frac{2}{l}\right) = \frac{1}{l}$$

= 2100°C

## '2004 유한요소법개론 Term Project

2000121134 윤창진

주제: Stainless steel gas tank 해석

목표 : Argon tank 해석을 통해 Pressure vessel 해석 결과를 살펴본다.

계획: ① CATIA 프로그램을 통한 기하학적 모델링

② ANSYS 프로그램을 통한 유한요소해석

- 적용 하중 : 압력 용기 내압, 용기 자중, 물의 중량

- 해석 대상 : 압력 용기 벽면, 지지대

해석대상: MB-137-A, Hanson Tank Co.(ASME Pressure Vessel Manufacturer)

![](_page_60_Figure_9.jpeg)

# **Pressure Vessel Design**

담당 박 정 선 : 교수님

항공우주공학전공4

학번 : 2000121134

성명 윤 창 진 :

1. 해석 주제

**1)** 해석 대상 : Stainless Steel Gas Tank

**2)** 해석 목적

압력용기의 설계 Flange

지침에 만족하여야 한다.

**3)** 대상의 용도

- GAS(LPG or LNG) 정해진 체적 내에 최대한 안전하고 다량의 를 저장하며 국내 설계

**4)** 구체적 해석 대상

Model : Hanson Propane Tank MB010-A

![](_page_62_Figure_8.jpeg)

**1)** 기하모델

![](_page_63_Picture_1.jpeg)

사용 S/W : Unigraphics V16

**2)** 유한요소모델

![](_page_63_Figure_4.jpeg)

- Element Type : Shell 8node 93 Shell 93 . 은 곡선 형상의 구조물 모델에 유용하게 적용된다 탄성과 소성 변형

해석 비선형 기하학 구조물 에 있어서 은 좋은 수렴성을 보여준다 ( ) Shell 93 .1)

- the Number of Nodes = 1917
- the Number of Elements = 620

<sup>1)</sup> ANSYS Tips and ANSYS Tricks, Peter Budgell (Burlington, Ontario, Canada)

![](_page_64_Figure_1.jpeg)

- : (Symmetric B.C.) . 경계조건 모든 경계 노드에 대칭 구속 조건 을 적용한다

- 하중조건

![](_page_64_Figure_4.jpeg)

LPG 231.1K 의 대기압에서의 비등점이 로써 기온이 약 ℃(313 K)에서의 포화압력은 약 10 . 150 psig( ) . 기압에 다다른다 따라서 압력용기 내부에 게이지압 을 가한다

1) 
$$150 \text{ psig}$$
 (thickness = 0.25 in.)

![](_page_65_Figure_2.jpeg)

\_

Von Mises Stress ( Equivalent Stress )

$$\sigma_{equiv} = \sigma' = \sqrt{\frac{(\sigma_1 - \sigma_2)^2 + (\sigma_2 - \sigma_3)^2 + (\sigma_3 - \sigma_1)^2}{2}}$$

Plane Stress

Hoop stress = 
$$\sigma_1 = \frac{\Pr}{t} = \frac{(150)(27)}{0.25} = 16200 psi$$

$$\sigma_2 = \frac{\Pr}{2t} = \frac{(150)(27)}{(2)(0.25)} = 8100psi$$

$$\sigma_{equiv} = \sigma' = \sqrt{\frac{(16200 - 8100)^2 + (8100)^2 + (16200)^2}{2}} = 14029 psi$$
 Von Mises Stress 10805 psi

2) 150 psig, (thickness = 0.25 in.)

![](_page_66_Figure_2.jpeg)

```
4. 설계로의 적용
1) 용접을 통한 압력용기 제작
a. 압력용기 제원 결정
두께를 바꾸어가며 해석한 결과 용기의 끝 반구형 부분 에는 가 그리고 (Dished Ends) 0.5 in.
일반 원통형 부분 에서는 이상이 필요하다 이러한 판단의 기준은 다음의 (Cylinder) 0.25 in. .
산업안전공단 허용응력 지침에 있다 두께가 일 때 반구형 부분의 최대 . 0.5 in. Von Mises
Stress 1/4 . 가 항복응력의 값에 해당함을 알 수 있었다
                                               출처 산업안전공단 :
강재의 허용응력으로는 보통정하중에 대하여 인장강도의 의 값 1/ 4 (연장에서는 항복점의
약 이 취해지고 있으며 최근 고항복점을 갖는 고장력강에 대하여는 인장강도의 1/2)
1/3( 40%) . 항복점의 약 의 응력이 쓰인다 이것은 구조물이 부하를 받았을 때에 재료가
항복하지 않는 것을 전제로 한 소위 탄성설계 에 의한 것이다 (elastic design) .
                  < > 압력용기 용접시 허용응력 지침
b. 압력용기에서 용접시 유의점
(1) . 가능한한 아래보기 용접이 되도록 한다
(2) , . 용접길이는 될 수 있는대로 짧게 또한 용착량도 강도상 필요한 최소한으로 한다
용접선을 감소시키기 위하여는 광폭의 판을 이용 또는 간단한 주단조부품을 병용하는 것이 ,
피로강도를 저하시켜 유해하다.
(3) 용접이음형상에는 많은 종류가 있으므로 그 특성을 잘 알아서 선택한다.
(4) ( ) 용접하기 쉽도록 설계해야 한다 용접간격고려
(5) .( .) 용접이음이 한곳에 집중되지 않게한다 용접선이 겹치지 않게한다
(6) 결함이 생기기 쉬운 용접은 피해야 하며 약한 필렛용접은 하지 않아야 한다.
( (stiffener) , ) 스티프너 사용 돌림용접
```

| 모재의 치수가 다른 부분의 접합이 필요한 경우도 많다<br>(1)<br>큰 차리가 있아는 부분을 접합할 경우에는 하중에 의한 응력이 접합부에 집중된다       |                                             |       |        | 모재의 치수    | 즉 판두께<br>,                 | 에<br>(<br>)<br>또<br>접 |
|-------------------------------------------------------------------------------------------|---------------------------------------------|-------|--------|-----------|----------------------------|-----------------------|
| 합부<br>,                                                                                   | 즉 용접금속 주변부에는 열영향에서 기계적 성질이 일부 열화되는 부분도 존재한다 |       |        |           |                            | . ,                   |
| 응력이 집중하고 그 장소에 강도상으로 열화하너 부분이 존재하면 당연히 접합부에서 응<br>력을 지지하지 못하게 되어 균열이 생기고 최종적으로는 파손사고에 이른다 |                                             |       |        |           |                            | 이를 방지하                |
| 기 위해서는 접합부에 응력이 집중하지 않도록 설계하여야 한다.                                                        |                                             |       |        |           |                            |                       |
| 그 방법은 접합할 개소의 부재치수를 맡추되 두꺼운 쪽의 부재치수를 얇은 쪽의 부재                                             |                                             |       |        |           |                            |                       |
| 치수에 맡추는 것이다.                                                                              |                                             |       |        |           |                            |                       |
| 접합부의 부재치수가 달라서 맞추지 않아도 되는 경우란<br>은 쪽의 부재 치수치가                                             | 이내이거나 판두께치가<br>10                           |       | ,<br>2 | 배 이내일 때이다 | 두꺼운 쪽의 부재치수와 얇<br>이와같은 경우에 |                       |
| 는 용접금속 덧살부에 직접 경시를 붙여 접합해도 무방하다.<br>부재의<br>치수가                                            | 달라<br>두꺼운<br>쪽의                             | 부재치수를 | 얇은     | 쪽의        | 부재치수로                      | 맞                     |
| 출 때에 접합부를 향하여 부재에 직접 경사를 붙여도 되나 경사도는 되도록 작은 편이 바                                          |                                             |       |        |           |                            |                       |
| 람직하다.                                                                                     |                                             |       |        |           |                            |                       |
| (2) 두꺼운 쪽의 부재에 붙이는 경사는 판두께분 이상의 병행부에서 끝으로 설치한다                                            |                                             |       |        |           |                            | 이.                    |
| 경우<br>병행부에서<br>경사부로<br>,<br>지 않도록 배려하는 것도 중요한 일이다.                                        | 이동하는<br>부분은                                 | 병행부와  | 경사부의   | 근원부에      | 응력이                        | 집중하                   |

c. ( ) 모재 두께가 다른 경우 구형과 실린더형의 이음매 의 기술 지침

![](_page_70_Figure_1.jpeg)

| Size Designation | Nominal Major<br>Diameter(in.) | Threads per inch N | Tensile Stress Area $A_t$ , $in^2$ | Minor Diameter Area $A_r$ , $in^2$ |
|------------------|--------------------------------|--------------------|------------------------------------|------------------------------------|
| $\frac{5}{8}$    | 0.6250                         | 11                 | 0.226                              | 0.202`                             |

Rotscher's Pressure-Cone Method2)

Flange

$$k_b = \frac{A_d A_t E}{A_d l_t + A_t l_d} = \frac{0.3068 \, (0.226) (30)}{0.3068 \, (0.75) + 0.227 \, (0.75)} = 5.21 M lbf/in$$

<sup>2)</sup> Y. Ito, J. Toyoda and S. Nagata, "Interface Pressure Distribution in a Bolt-Flange Assembly," ASME paper no.77WA/DE-11, 1977.

Stainless steel

$$k_m = \frac{0.5774\pi Ed}{2\ln\left[5\frac{0.5774l + 0.5d}{0.5774l + 2.5d}\right]} = \frac{0.5774\pi(0.2)(0.625)}{2\ln\left[5\frac{(0.5774)(1.5) + 0.5(0.625)}{0.5774(1.5) + 2.5(0.625)\right]}} = 0.118Mbf/in$$

$$C = \frac{k_b}{k_b + k_m} = \frac{5.21}{5.21 + 0.118} = 0.978$$

$$F_i = 0.75 A_t S_p = 0.75 (0.226)(85) = 14.4 kip$$

$$n = \frac{S_p A_t - F_i}{C(P/N)}$$

safety factor

$$N = \frac{CnP}{S_p A_t - F_i} :$$

P Separating Force

**FEA** 

$$P = \sigma_{\textit{VonMises}} \frac{\pi}{4} (d^2 - (d-2t)^2) = 12345 \times \frac{\pi}{4} (27^2 - ((27-2(0.25))^2) = 259361 lbf = 259 kip + (27 - 2(0.25))^2) = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259361 lbf = 259 kip + (27 - 2(0.25))^2 = 259661 lbf = 259 kip + (27 - 2(0.25))^2 = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 259661 lbf = 2$$

$$N = \frac{CnP}{S_n A_t - F_i} = \frac{(0.978)(2)(259)}{(85)(0.226) - 14.4} = 105.323($$

b. Cast iron

$$k_m = \frac{0.5774\pi Ed}{2\ln\left[5\frac{0.5774l + 0.5d}{0.5774l + 2.5d}\right]} = \frac{0.5774\pi(14)(0.625)}{2\ln\left[5\frac{(0.5774)(1.5) + 0.5(0.625)}{0.5774(1.5) + 2.5(0.625)}\right]} = 8.95Mlbf/in$$

$$C = \frac{k_b}{k_b + k_m} = \frac{5.21}{5.21 + 8.95} = 0.368$$

$$N = \frac{CnP}{S_n A_t - F_i} = \frac{(0.368)(2)(259)}{(85)(0.226) - 14.4} = 39.63()$$

, Flange Cast Iron

40 , Stainless Stell

106 . Flange Cast iron

.

(1) , 플릿용접에 한하지 않고 맞대기용접 에너지용접에서도 용접부 주변에는 반드시 열영향부가 생기게 마련이다 나중에 풀림에 의한 용접시의 잔류응력 제거와 용접에 . 등의 트러블로 이어진다. (2) 용접 구조물의 리브와 플랜지의 하중별로 대응하는 가장좋은 배치와 용접법은 리 브와 프랜지를 가급적이면 부분에 집중시키지 않도록한다 부분에의 집중을 피하는 1 .1 것은 하중에 따른 응력의 집중을 피하는 것이 목적이다 또 동시에 리브용접에 수반 . , 하는 잔류응력의 집중을 피한다는 의미도 포함되어 있다. - , 한편 리브의 집중개소에 있어서의 잔류 내부응력을 분산시키기 위해서는 용접후에 풀림처리를 할 필요가 있다.

#### 5. 참 고

- 1) Theory of plates and shells Timoshenko and Woinowsky-kreiger 2) Pressure Vessel Design - J.Spence, A.S.Tooth (E&FN SPON) 3) - 5 (Prentice Hall) 알기쉬운 유한요소해석 박정선 외 명 공역 4) - FEA 유한요소해석 입문과 선형해석 태성에스엔이 사업부 5) Ansys - ( ) 를 이용한 유한요소해석 박형진 광문사 6) Mechanical Engineering Design - Joseph E. Shigley 2 (McGrawHill) 외 명 7) Mechanics of Material 5th Ed. - James M. Gere (Brooks/Coles) 8) - (KOSHA CODE M-19-1997) 압력용기 용접 설계 지침 한국산업안전공단 9) (NIST) Chemistry Web Book 미국국립표준기술연구소
- 10) ANSYS Tips and ANSYS Tricks, Peter Budgell (Burlington, Ontario, Canada)