import json

result = {}
result['products'] = []
with open('products-gatsby.json') as data_file:
    for line in data_file:
        j_content = json.loads(line)
        result['products'].append(j_content)


with open('products.json', 'w') as json_file:
    json_file.write(json.dumps(result))
