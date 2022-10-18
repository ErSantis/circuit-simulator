from solve import Circuit
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import json


app = Flask(__name__, template_folder='templates')
CORS(app)




@app.route('/circuit1', methods=['POST'])
def circuit1():
    
    body = request.json
    print(body)
    example1 = Circuit()
    R1=body[0][1]
    R2=body[1][1]
    R3=body[2][1]

    V1=body[0][3]
    V2=body[1][3]
    V3=body[2][3]

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
    R1=body[0][1]
    V1=body[0][3]

    R2=body[1][1]
    R3=body[2][1]
    example2 = Circuit()
    example2.add_branch((1, 2), R = R1, V = V1)
    example2.add_branch((1, 2), R = R2, I = 5)
    example2.add_branch((1, 2), R = R3, V = 0)
    print(example2)
    return jsonify(body)


@app.route('/circuit3', methods=['POST'])
def circuit3():
    body = request.json
    print(body)
    return jsonify(body)

if __name__ == '__main__':
    app.run(debug=True, port=5501)
