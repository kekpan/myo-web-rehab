from application import build_app
from application.models import Patient, Professional, Program, db

app = build_app()
app.app_context().push()

db.drop_all()
db.session.commit()

db.create_all()
db.session.commit()

nst = Professional(username='nst', email='nst@example.com')
db.session.add(nst)
db.session.commit()

programs = []
programs.append(Program(prog_group=1, week_no=1, day_no=1, wvi_sets=2, wvi_reps=3, wvi_dur=10, wvo_sets=2, wvo_reps=3, wvo_dur=15, fst_sets=1,
                fst_reps=3, fst_dur=15, dtp_sets=2, dtp_reps=4, dtp_dur=10, fsd_sets=2, fsd_reps=3, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=1, day_no=2, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=5, wvo_dur=10, fst_sets=1,
                fst_reps=4, fst_dur=15, dtp_sets=2, dtp_reps=5, dtp_dur=10, fsd_sets=2, fsd_reps=5, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=1, day_no=3, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=5, wvo_dur=10, fst_sets=1,
                fst_reps=4, fst_dur=15, dtp_sets=2, dtp_reps=5, dtp_dur=10, fsd_sets=2, fsd_reps=5, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=1, day_no=4, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=5, wvo_dur=10, fst_sets=1,
                fst_reps=4, fst_dur=15, dtp_sets=2, dtp_reps=5, dtp_dur=10, fsd_sets=2, fsd_reps=5, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=1, day_no=5, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=7, wvo_dur=15, fst_sets=2,
                fst_reps=3, fst_dur=12, dtp_sets=2, dtp_reps=7, dtp_dur=10, fsd_sets=2, fsd_reps=7, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=2, day_no=6, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=7, wvo_dur=15, fst_sets=2,
                fst_reps=3, fst_dur=12, dtp_sets=2, dtp_reps=7, dtp_dur=10, fsd_sets=2, fsd_reps=7, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=2, day_no=7, wvi_sets=2, wvi_reps=5, wvi_dur=10, wvo_sets=2, wvo_reps=7, wvo_dur=15, fst_sets=2,
                fst_reps=3, fst_dur=12, dtp_sets=2, dtp_reps=7, dtp_dur=10, fsd_sets=2, fsd_reps=7, fsd_dur=15, rest_sets=0, rest_reps=15, pro_id=1))
programs.append(Program(prog_group=1, week_no=2, day_no=8, wvi_sets=3, wvi_reps=3, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=2,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=10, rest_reps=10, pro_id=1))
programs.append(Program(prog_group=1, week_no=2, day_no=9, wvi_sets=3, wvi_reps=3, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=2,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=10, rest_reps=10, pro_id=1))
programs.append(Program(prog_group=1, week_no=2, day_no=10, wvi_sets=3, wvi_reps=3, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=2,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=10, rest_reps=10, pro_id=1))
programs.append(Program(prog_group=1, week_no=3, day_no=11, wvi_sets=3, wvi_reps=3, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=2,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=10, rest_reps=7, pro_id=1))
programs.append(Program(prog_group=1, week_no=3, day_no=12, wvi_sets=3, wvi_reps=3, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=2,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=10, rest_reps=7, pro_id=1))
programs.append(Program(prog_group=1, week_no=3, day_no=13, wvi_sets=3, wvi_reps=5, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=3,
                fst_reps=3, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=3, day_no=14, wvi_sets=3, wvi_reps=5, wvi_dur=10, wvo_sets=3, wvo_reps=5, wvo_dur=15, fst_sets=3,
                fst_reps=3, fst_dur=12, dtp_sets=3, dtp_reps=5, dtp_dur=10, fsd_sets=3, fsd_reps=5, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=3, day_no=15, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=4, day_no=16, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=4, day_no=17, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=4, day_no=18, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=4, day_no=19, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
programs.append(Program(prog_group=1, week_no=4, day_no=20, wvi_sets=3, wvi_reps=6, wvi_dur=10, wvo_sets=3, wvo_reps=6, wvo_dur=15, fst_sets=3,
                fst_reps=4, fst_dur=12, dtp_sets=3, dtp_reps=6, dtp_dur=10, fsd_sets=3, fsd_reps=6, fsd_dur=15, rest_sets=8, rest_reps=5, pro_id=1))
db.session.add_all(programs)
db.session.commit()

programs = []
programs.append(Program(prog_group=0, week_no=1, day_no=1, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=2, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=3, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=4, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=5, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=6, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=1, day_no=7, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=8, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=9, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=10, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=11, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=12, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=13, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=2, day_no=14, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=15, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=16, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=17, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=18, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=19, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=20, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=3, day_no=21, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=22, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=23, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=24, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=25, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=26, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=27, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
programs.append(Program(prog_group=0, week_no=4, day_no=28, wvi_sets=0, wvi_reps=0, wvi_dur=0, wvo_sets=0, wvo_reps=0, wvo_dur=0, fst_sets=0,
                fst_reps=0, fst_dur=0, dtp_sets=0, dtp_reps=0, dtp_dur=0, fsd_sets=1, fsd_reps=1, fsd_dur=1, rest_sets=1, rest_reps=1, pro_id=1))
db.session.add_all(programs)
db.session.commit()

tom = Patient(username='tom', email='tom@example.com',
               pro_id=1, days_done=0, prog_group=1)
chou = Patient(username='chou', email='chou@example.com',
               pro_id=1, days_done=0, prog_group=1)
test = Patient(username='test', email='test@example.com',
               pro_id=1, days_done=0, prog_group=0)
db.session.add_all([tom, chou, test])
db.session.commit()
