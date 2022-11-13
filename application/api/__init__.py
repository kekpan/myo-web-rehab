from datetime import datetime

from flask import Blueprint, jsonify, request
from flask.views import MethodView

from application.models import Patient, Program, Session, db

api_bp = Blueprint('api', __name__, static_folder='static',
                   template_folder='templates', url_prefix='/api')


class ProgramAPI(MethodView):

    def get(self, username):
        if username is None:
            return jsonify({'Get all programs': 'Coming soon'})
        else:
            patient = Patient.query.filter_by(username=username).first()
            program = Program.query.filter_by(
                prog_group=patient.prog_group, day_no=patient.days_done+1).first()
            totLevels = []
            for week_idx in range(1, 5):
                num_of_levels = Program.query.filter_by(
                    prog_group=patient.prog_group, week_no=week_idx).count()
                totLevels.append(num_of_levels)
            data = {
                'pt_id': patient.id,
                'prog_id': program.id,
                'curtWld': program.week_no,
                'curtLvl': program.day_no,
                'totLevels': totLevels,
                'setsToDo': {
                    'fingers_spread': program.fsd_sets,
                    'fist': program.fst_sets,
                    'double_tap': program.dtp_sets,
                    'wave_in': program.wvi_sets,
                    'wave_out': program.wvo_sets,
                },
                'repsToDo': {
                    'fingers_spread': program.fsd_reps,
                    'fist': program.fst_reps,
                    'double_tap': program.dtp_reps,
                    'wave_in': program.wvi_reps,
                    'wave_out': program.wvo_reps,
                },
                'durations': {
                    'fingers_spread': program.fsd_dur * 1000,
                    'fist': program.fst_dur * 1000,
                    'double_tap': program.dtp_dur * 1000,
                    'wave_in': program.wvi_dur * 1000,
                    'wave_out': program.wvo_dur * 1000,
                },
                'restBtwReps': program.rest_reps * 1000,
                'restBtwSets': program.rest_sets * 1000,
            }
            return jsonify(data)


class SessionAPI(MethodView):

    def post(self):
        req = request.json
        start_ts = datetime.fromtimestamp(request.json['start_ts'])
        end_ts = datetime.fromtimestamp(request.json['end_ts'])
        session = Session(start_ts=start_ts, pt_id=req['pt_id'], prog_id=req['prog_id'], wvi_sets=req['wvi_sets'], wvo_sets=req['wvo_sets'],
                          fst_sets=req['fst_sets'], dtp_sets=req['dtp_sets'], fsd_sets=req['fsd_sets'], end_ts=end_ts, success=req['success'])
        patient = Patient.query.get(req['pt_id'])
        patient.days_done += 1
        db.session.add_all([session, patient])
        db.session.commit()
        return jsonify({'sessionId': session.id})

    # def put(self, ses_id):
    #     ses = Session.query.get(ses_id)
    #     match request.json["event"]:
    #         case 'wave_in':
    #             ses.wvi_sets += 1
    #         case 'wave_out':
    #             ses.wvo_sets += 1
    #         case 'double_tap':
    #             ses.dtp_sets += 1
    #         case 'fingers_spread':
    #             ses.fsd_sets += 1
    #         case 'fist':
    #             ses.fst_sets += 1
    #         case _:
    #             ses.end_ts = datetime.fromtimestamp(request.json['end_ts'])
    #             ses.success = request.json['success']
    #     db.session.commit()
    #     return jsonify({'PUT': 'OK'})


program_view = ProgramAPI.as_view('program_api')
api_bp.add_url_rule('/programs/',
                    defaults={'username': None}, view_func=program_view, methods=['GET'])
api_bp.add_url_rule('/programs/<username>',
                    view_func=program_view, methods=['GET'])

session_view = SessionAPI.as_view('session_api')
api_bp.add_url_rule('/sessions/',
                    view_func=session_view, methods=['POST'])
api_bp.add_url_rule('/sessions/<int:ses_id>',
                    view_func=session_view, methods=['PUT'])
