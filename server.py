from solve import Circuit
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
import json

app = Flask(__name__, template_folder='templates')
CORS(app)

example1 = Circuit()


@app.route('/test', methods=['POST'])
def test():
    body = request.json

    example1.add_branch((1, 2), R=body[0][1], V=body[0][3])
    example1.add_branch((1, 2), R=body[1][1], V=body[1][3])
    example1.add_branch((1, 2), R=body[2][1], V=body[2][3])

    print(example1)
    return jsonify(body)



if __name__ == '__main__':
    app.run(debug=True, port=5501)
