from flask import Flask, render_template, url_for, request, jsonify, flash,redirect, session
import pandas as pd
import numpy as np
import re
import os

app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb+srv://VaiLab:VaiLab123@cluster0-4nqps.mongodb.net/news_engagement"
app.config["SECRET_KEY"] = '80e2229aa326ca04ee982aa63b9b0f13'

###default route, home page
@app.route("/")   
def welcome():
    return redirect("/book/persuasion/")

###default route, home page
@app.route("/book/<name>/<index>/<value_column>")
def book(name, index, value_column):
    session.clear()
    data = pd.read_csv("static/data/book/" + name + ".csv")
    session['name'] = name
    return render_template("home.html", data = data.to_dict(orient="records"),
        index = index,  value_column = value_column)

@app.route("/save_data", methods=["POST"])
def save_data():
    if "name" in session:
        req = request.get_json(force=True)
        data = pd.DataFrame.from_records(req['data'])
        name = session['name']

        data.to_csv('./static/data/backup/'+name+ '.csv', index= False)
        return jsonify(msg="success")
    else:
        return jsonify(msg="fail")

if __name__ == "__main__":
    app.run(port=5000, debug=True)