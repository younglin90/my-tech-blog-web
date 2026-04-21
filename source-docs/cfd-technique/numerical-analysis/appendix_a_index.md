# appendix_a_index

> 원본: `numerical-analysis/appendix_a_index.pdf` (0.0MB, 2 페이지 추출)

## 페이지 1
Appendix A
The index notation of tensor calculus
The index notation is a very powerful way of dealing with vectors, matrices and tensors. The
topicoftensormathematicsandtheindexnotationisfartoofar-reachingtocoverindepthinthis
shortappendix. Here weonlycovertheabsolutebasics.
A vector (i.e. an object with spatial direction) is denoted in normal vector notation as ~u, or
sometimesalsoasu(inthislecturewewrite~u). Avectorisatensorofrank1. Inindexnotation
we refer to the individual components of the vector by writing it as u , where i is an index that
i
can bechosen tobeeither1,2 or3.
A matrix is often written as M. It has two indices, i.e. 9 components (if related to true
space, i.e. if it is a transformation in space like a rotation). A matrix is a tensor of rank 2. In
indexnotationit is written as M , where theindices i and j are 1, 2 or3. The unitmatrix isδ ,
ij ij
whichis defined as:
1 ifi = j
δ = (A.1)
ij (cid:26)0 ifi 6= j
whichis called theKronecker deltafunctionintensormathematics.
A matrix is not the only kind of second rank tensor. The pressure tensor or stress tensor
in hydrodynamics is also one, and in many respects that kind of object behaves very similar to
a matrix. But formally it is not entirely the same. This can not be seen as long as one works
in cartesian coordinates: then the pressure/stress tensor behaves exactly like a matrix. But in
generalcoordinatetransformations,inwhichthelocalbasisisnolongercartesian,thetwokinds
of objects behave differently. For details see the tensor syllabus mentioned above, or other
literature on tensor calculus. For completeness: a matrix is contravariant in the first index, and
covariant in the second (or vice-versa) while the stress tensor is contravariant in both indices.
Again, as long as one remains in cartesian coordinates (i.e. x, y and z or rotations thereof) this
distinctionisirrelevant.
Averyimportantthingsoftheindexnotationisthesummationconvention. Thisconvention
saysthatifanindexappearstwiceinthesameproduct,thenitisautomaticallyassumedthatthis
is being summed over, from 1 to 3. So the followingexpressionis a matrixmultiplicationwith a
vector:
3 3
M u ≡ M u ≡ M u ≡ M u (A.2)
ik k ik k im m im m
Xk=1 mX=1
and allfourexpressionsare (by thesummationconvention)thesame.
Theinner-productofavector~uwithw~ is thenwrittenas:
~u·w~ = u w (A.3)
i i
37

## 페이지 2
38
(Note: here u and w are not the (u,v,w) components of ~u, as used often in this lecture, but
i k
theyare thei-th componentof~uand thek-th componentofvectorw~ respectivelyhere.)
Thedivergenceofavectorfield iswrittenas:
∇·~u = ∇ u ≡ ∂ u (A.4)
i i i i
Thetwoways ofwriting(with∇ or∂ )arebothoftenused, andIwillusebothwaysofwriting
i i
inthislecturewithoutnotice. Thedivergenceofatensorfield ρ~u~u (inindexnotationρu u )is:
i j
∇·(ρ~u~u)| = ∇ (ρu u ) (A.5)
componentk i i k
