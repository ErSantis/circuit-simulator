import numpy as np
v1 = int(input("Ingrese V1: "))
v2 = int(input("Ingrese V2: "))
v3 = int(input("Ingrese V3: "))
r1 = int(input("Ingrese R1: "))
r2 = int(input("Ingrese R2: "))
r3 = int(input("Ingrese R3: "))


## CODE QUE IMPORTA ----------------------------

a = np.array([[r1+r2, -r2], [-r2, r2+r3]])
b = np.array([v2-v1, v3-v2])
I = np.linalg.solve(a, b)
i1 = abs(I[0])
i2 = abs(I[1])
i3 = abs(I[0]-I[1])

## ----------------------------------------


print(I)
