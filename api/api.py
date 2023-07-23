from flask import Flask, jsonify
import random

app = Flask(__name__)

students_online = []
instructor_online = []
tutors_online = []
teaching_assistants_online = []
operation_team_online = []

@app.route('/api/hello')
def hello():
    count = random.randint(0, 200)
    response = {
        "count": count,
        "studentsOnline": students_online,
        "instructorOnline": instructor_online,
        "tutorsOnline": tutors_online,
        "teachingAssistantsOnline": teaching_assistants_online,
        "operationTeamOnline": operation_team_online
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
