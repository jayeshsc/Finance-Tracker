from flask import Flask, render_template, request, jsonify,Response
import json
import uuid
import csv
import io
app = Flask(__name__)

JSON_FILE = 'transactions.json'

def read_transactions():
    try:
        with open(JSON_FILE, 'r') as file:
            return json.load(file)
    except FileNotFoundError:
        return []

def write_transactions(transactions):
    with open(JSON_FILE, 'w') as file:
        json.dump(transactions, file, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add-transaction', methods=['POST'])
def add_transaction():
    data = request.get_json()
    description = data['description']
    amount = data['amount']

    if description and isinstance(amount, (int, float)):
        transactions = read_transactions()
        id = str(uuid.uuid4())
        transactions.append({'id': id, 'description': description, 'amount': amount})
        write_transactions(transactions)
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Invalid data'})

@app.route('/get-transactions')
def get_transactions():
    transactions = read_transactions()
    return jsonify(transactions)



@app.route('/search-transactions', methods=['POST'])
def search_transactions():
    search_text = request.get_json()['searchText']
    transactions = read_transactions()

    # Filter transactions based on the search text (matching ID or description)
    filtered_transactions = [transaction for transaction in transactions if
        search_text.lower() in transaction['id'].lower() or
        search_text.lower() in transaction['description'].lower()]

    return jsonify(filtered_transactions)

@app.route('/export-csv')
def export_csv():
    transactions = read_transactions()
    if transactions:
        response = Response(generate_csv(transactions), content_type='text/csv')
        response.headers['Content-Disposition'] = 'attachment; filename=transactions.csv'
        return response
    else:
        return jsonify({'success': False, 'error': 'No data to export'})

def generate_csv(transactions):
    header = ['ID', 'Description', 'Amount']
    rows = [(transaction['id'], transaction['description'], transaction['amount']) for transaction in transactions]
    data = [header] + rows
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerows(data)
    return output.getvalue()


if __name__ == '__main__':
    app.run(debug=True)
