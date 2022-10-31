from solve import Circuit
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import json


app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return "Welcome to the Circuit Solver"


@app.route('/circuit1', methods=['POST'])
def circuit1():
    
    body = request.json

    example1 = Circuit()
    R1=float(body[0][1])
    R2=float(body[1][1])
    R3=float(body[2][1])

    V1=float(body[0][3])
    V2=float(body[1][3])
    V3=float(body[2][3])

    example1.add_branch((1, 2), R=R1, V=V1)
    example1.add_branch((1, 2), R=R2, V=V2)
    example1.add_branch((1, 2), R=R3, V=V3)

    intensidades = []
    for branch in example1.branches:
        print('I',abs(example1._circuit.edges[branch]['I']), 'R', example1._circuit.edges[branch]['R'], 'V', example1._circuit.edges[branch]['V'])
        intensidades.append(float(abs(example1._circuit.edges[branch]['I'])))
    print(intensidades)
    return jsonify(intensidades)


@app.route('/circuit2', methods=['POST'])
def circuit2():
    body = request.json
    
    example2 = Circuit()
    V1=float(body[0][1])
    R1=float(body[0][3])

    R2=float(body[0][5])
    R3=float(body[0][7])
    
    RT=R1+R2+R3

    example2.add_branch(("A", "B"), R = RT, V = V1)
    print(example2)
        
    intensidad = V1/RT
    


    return jsonify(intensidad)


@app.route('/circuit3', methods=['POST'])
def circuit3():
    body = request.json

    example3 = Circuit()
    R1=float(body[0][1])
    V1=float(body[0][3])

    R2=float(body[1][1])

    R3=float(body[2][1])
    V3=float(body[2][3])

    R4=float(body[3][3])
    V4=-1*float(body[3][1])

    R5=float(body[4][1])
    V5=float(body[4][3])

    R6=float(body[5][1])+float(body[5][3])
    R7=float(body[6][1])

    R8=float(body[7][1])+float(body[7][3])
    V8=float(body[7][7])-float(body[7][5])

    example3.add_branch(('A', 'B'), R = R1, V = V1)
    example3.add_branch(('A', 'C'), R = R2, V = 0)
    example3.add_branch(('A', 'D'), R = R3, V = V3)
    example3.add_branch(('B', 'C'), R = R4, V = V4)
    example3.add_branch(('B', 'C'), R = R5, V = V5)
    example3.add_branch(('B', 'D'), R = R6, V = 0)
    example3.add_branch(('B', 'D'), R = R7, V = 0)
    example3.add_branch(('A', 'B'), R = R8, V = V8)

    intensidades = []
    for branch in example3.branches:
        print('I',abs(example3._circuit.edges[branch]['I']), 'R', example3._circuit.edges[branch]['R'], 'V', example3._circuit.edges[branch]['V'])
        intensidades.append(float(abs(example3._circuit.edges[branch]['I'])))
    print(intensidades)

    return jsonify(intensidades)

if __name__ == '__main__':
    app.run(debug=True, port=5501)
