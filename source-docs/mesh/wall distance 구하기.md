# wall distance 구하기

> 원본: `mesh/wall distance 구하기.docx`

Eikonal 방정식을 좀 더 개량하면,
차분화하면,
Implicit 고려하면,
여기서 업윈드를 사용하면
[1] 방법 정리
Eikonal 방정식
여기서, F=1 을 구하는게 주 목적
방향벡터 P_r ; 각 이웃 정점 x_r과의 방향 벡터를
로 정의하고, 이들을 행으로 모은 행렬을 다음과 같이 정의
방향도함수 v_r ; 각 방향 P_r에 대한 도함수 근사값을 v_r라 하고, 벡터로 모으면
이 관계를 행렬식으로 쓰면,
노멀 방정식
따라서 Eikonal 과 결합하면
Q=(PP^T)^-1, V=ua+b라고 하면, 이 방정식은 2차방정식으로 됨.
여기서, a와 b는
에서
2차 스키마는,
즉
Upwinding(인과성) 조건 ; 2차 방정식의 두 근중, 근사 gradient가 해당 simplex 내부를 향할 때만 가능. 즉,
의 모든 성분이 >=0 인 해만 받아들인다.
알고리즘 ; 비정형 메쉬 위에서 O(M logM) 시간에 푸는 Fast Marching 기법을 Dijkstra-like 순서로 수행.
Accepted, Considered, Far 세 집합으로 노드 상태를 구분.
이차 방정식을 풀어 국소 후보값(Trial) 계산
Min-heap으로 가장 작은 Trial 값을 가진 점부터 Accepted로 이동
[1] Sethian, James A., and Alexander Vladimirsky. "Fast methods for the Eikonal and related Hamilton–Jacobi equations on unstructured meshes." Proceedings of the National Academy of Sciences 97.11 (2000): 5699-5703.
