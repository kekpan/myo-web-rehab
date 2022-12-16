from datetime import datetime

from flask import Blueprint, jsonify, request
from flask.views import MethodView
from flask_login import current_user

from application.models import Patient, Program, Session, db

api_bp = Blueprint(
    "api",
    __name__,
    static_folder="static",
    template_folder="templates",
    url_prefix="/api",
)


class InvalidAPIUsage(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        super().__init__()
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv["message"] = self.message
        rv["status"] = self.status_code
        return rv


@api_bp.errorhandler(InvalidAPIUsage)
def invalid_api_usage(e):
    return jsonify(e.to_dict()), e.status_code


class ProgramAPI(MethodView):
    def get(self, username):
        if username is None:
            return jsonify({"Get all programs": "Coming soon"})
        else:
            if username != current_user.username:
                raise InvalidAPIUsage(
                    "You do not have access rights to other users' programs",
                    status_code=403,
                )
            patient = Patient.query.filter_by(username=username).first()
            program = Program.query.filter_by(
                prog_group=patient.prog_group, day_no=patient.days_done + 1
            ).first()
            if not program:
                raise InvalidAPIUsage(
                    "Your therapist has not assigned you an exercise routine yet.",
                    status_code=404,
                )
            totLevels = []
            for week_idx in range(1, 5):
                num_of_levels = Program.query.filter_by(
                    prog_group=patient.prog_group, week_no=week_idx
                ).count()
                totLevels.append(num_of_levels)
            start_date = (
                datetime.timestamp(patient.start_date) * 1000
                if patient.start_date
                else 0
            )
            last_day_week = (
                Program.query.filter_by(prog_group=patient.prog_group)
                .order_by(Program.day_no.desc())
                .first()
                .day_week
            )
            data = {
                "pt_id": patient.id,
                "prog_id": program.id,
                "curtWld": program.week_no,
                "curtLvl": program.day_no,
                "totLevels": totLevels,
                "dayWeek": program.day_week,
                "lastDayWeek": last_day_week,
                "startDate": start_date,
                "setsToDo": {
                    "fingers_spread": program.fsd_sets,
                    "fist": program.fst_sets,
                    "double_tap": program.dtp_sets,
                    "wave_in": program.wvi_sets,
                    "wave_out": program.wvo_sets,
                },
                "repsToDo": {
                    "fingers_spread": program.fsd_reps,
                    "fist": program.fst_reps,
                    "double_tap": program.dtp_reps,
                    "wave_in": program.wvi_reps,
                    "wave_out": program.wvo_reps,
                },
                "durations": {
                    "fingers_spread": program.fsd_dur * 1000,
                    "fist": program.fst_dur * 1000,
                    "double_tap": program.dtp_dur * 1000,
                    "wave_in": program.wvi_dur * 1000,
                    "wave_out": program.wvo_dur * 1000,
                },
                "restBtwReps": program.rest_reps * 1000,
                "restBtwSets": program.rest_sets * 1000,
            }
            return jsonify(data)


class SessionAPI(MethodView):
    def post(self):
        req = request.json
        start_ts = datetime.fromtimestamp(request.json["start_ts"])
        if req["success"]:
            end_ts = datetime.fromtimestamp(request.json["end_ts"])
        else:
            end_ts = None
        session = Session(
            start_ts=start_ts,
            pt_id=req["pt_id"],
            prog_id=req["prog_id"],
            wvi_sets=req["wvi_sets"],
            wvo_sets=req["wvo_sets"],
            fst_sets=req["fst_sets"],
            dtp_sets=req["dtp_sets"],
            fsd_sets=req["fsd_sets"],
            end_ts=end_ts,
            success=req["success"],
        )
        patient = Patient.query.get(req["pt_id"])
        patient.days_done += 1
        if not patient.start_date:
            patient.start_date = start_ts
        db.session.add_all([session, patient])
        db.session.commit()
        return jsonify({"sessionId": session.id})


program_view = ProgramAPI.as_view("program_api")
api_bp.add_url_rule(
    "/programs/", defaults={"username": None}, view_func=program_view, methods=["GET"]
)
api_bp.add_url_rule("/programs/<username>", view_func=program_view, methods=["GET"])

session_view = SessionAPI.as_view("session_api")
api_bp.add_url_rule("/sessions/", view_func=session_view, methods=["POST"])
api_bp.add_url_rule("/sessions/<int:ses_id>", view_func=session_view, methods=["PUT"])
