# ----- Example Python program to create a database in PostgreSQL using Psycopg2 -----

# import the PostgreSQL client for Python

import psycopg2
import json, sys, math

from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from psycopg2 import connect, Error


# Connect to PostgreSQL DBMS

con = psycopg2.connect(user="postgres", password="password", host="127.0.0.1");

con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT);

# Obtain a DB Cursor

cursor = con.cursor();

name_Database = "hipster";

# Create table statement

sqlCreateDatabase = "create database " + name_Database + ";"

# Create a table in PostgreSQL database

cursor.execute(sqlCreateDatabase);
con.commit()
cursor.close()
con.close()

con = psycopg2.connect(user="postgres", password="password", host="127.0.0.1", database="hipster");
cursor = con.cursor();

cursor.execute("""CREATE TABLE IF NOT EXISTS products(
	   id                    VARCHAR(20) NOT NULL PRIMARY KEY
	  ,name                  VARCHAR(200) NOT NULL
	  ,description           VARCHAR(10000) NOT NULL
	  ,picture               VARCHAR(200) NOT NULL
	  ,priceUsdcurrencyCode  VARCHAR(200) NOT NULL
	  ,priceUsdunits         INTEGER  NOT NULL
	  ,priceUsdnanos         INTEGER 
	  ,categories           VARCHAR(200) NOT NULL
	);""")


con.commit()

with open('products.json') as json_data:
    # use load() rather than loads() for JSON files
    record_list = json.load(json_data)
    first_record = record_list[0]
    columns = list(first_record.keys())
    print ("\ncolumn names:", columns)

    for product in record_list:
        print(product)
#
        table_name = "json_data"
        sql_string = 'INSERT INTO products(id,name,description,picture,priceUsdcurrencyCode,priceUsdunits,priceUsdnanos,categories) VALUES ('
        sql_string += "'" + product['id'] +"', "
        sql_string += "'" + product['name'] + "', "
        sql_string += "'" + product['description'] + "', "
        sql_string += "'" + product['images'][0] + "', "
        sql_string += "'" + "USD" + "', "
        sql_string += "'" + str(math.floor(float(product['price']))) + "', "
        sql_string += "'" + str(math.floor((float(product['price']) - math.floor(float(product['price']))) * 1000000000)) + "', "
        sql_string += "'" + product['category'] + "'"
        sql_string += ")ON CONFLICT (id) DO NOTHING;"
        print(sql_string)
        cursor.execute(sql_string)
        con.commit()

cursor.close()
con.commit()
con.close()