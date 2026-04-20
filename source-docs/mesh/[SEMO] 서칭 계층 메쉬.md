# [SEMO] 서칭 계층 메쉬

> 원본: `mesh/[SEMO] 서칭 계층 메쉬.docx`

서칭 계층 메쉬
빠른 충돌 검출 (collision detection) 을 하기 위해, 계층 구조의 메쉬 사용
위 코드는,
Octree 메쉬에서 하계 계층의 모든 메쉬 (fluid, solid1, solid2) 들의 셀들을 찾고, 그 셀들을 octree 셀에 넣어준다. 그리고 fluid 메쉬에서 하계 계층 메쉬들 (solid1, solid2) 의 셀들을 찾고, fluid 셀에 넣어준다. 위치를 서칭할때는, top-down 방식으로 위치들을 찾아준다. 그래서, 서칭 계산 시간이 적게 걸리는 것을 top 에 올려놓는 것이 좋다.
Contain 메쉬
