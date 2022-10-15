from flask import Flask, jsonify, render_template, request

app = Flask(__name__, template_folder='templates')



@app.route('/')
def home():
    return render_template('alfa.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    pass

if __name__ == '__main__':
    app.run(debug=True, port=5000)
