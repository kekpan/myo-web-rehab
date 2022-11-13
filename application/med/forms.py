from types import NoneType

from flask_login import current_user
from flask_wtf import FlaskForm
from wtforms import BooleanField, IntegerField, SelectField, StringField
from wtforms.validators import (InputRequired, NumberRange, Optional,
                                ValidationError)

from application.models import Patient


class AssignForm(FlaskForm):
    username = StringField('Username', [InputRequired()])

    def validate_username(form, field):
        patient = Patient.query.filter_by(username=form.username.data).first()
        if patient is None:
            raise ValidationError(
                f'User "{form.username.data}" does not exist.')
        elif patient.pro_id != current_user.id:
            raise ValidationError(
                f'You have no permission for user "{patient.username}"')

    routine = SelectField('Choose a Routine')


class ProgramForm(FlaskForm):
    def validate_group(form, field):
        w = field.name.split('_')[1][0]
        d = field.name.split('_')[1][1]
        inputs = ['wvis_', 'wvir_', 'wvid_', 'wvos_', 'wvor_', 'wvod_', 'fsts_', 'fstr_',
                  'fstd_', 'fsds_', 'fsdr_', 'fsdd_', 'dtps_', 'dtpr_', 'dtpd_', 'rbts_', 'rbtr_']
        if form['skip_'+str(w)+str(d)].data == False:
            for inp in inputs:
                if type(form[inp+str(w)+str(d)].data) == NoneType:
                    raise ValidationError(
                        f'Day {w}-{d} requires some additional values.')
        else:
            for inp in inputs:
                if type(form[inp+str(w)+str(d)].data) != NoneType:
                    raise ValidationError(
                        f'Day {w}-{d} is to be skipped but contains values.')

    wvis_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvir_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvid_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvos_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvor_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvod_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fsts_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fstr_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fstd_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fsds_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fsdr_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    fsdd_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    dtps_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    dtpr_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    dtpd_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    rbts_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    rbtr_11 = IntegerField(validators=[NumberRange(min=0), InputRequired()])
    wvis_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_12 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_12 = BooleanField(validators=[validate_group])
    wvis_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_13 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_13 = BooleanField(validators=[validate_group])
    wvis_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_14 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_14 = BooleanField(validators=[validate_group])
    wvis_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_15 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_15 = BooleanField(validators=[validate_group])
    wvis_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_16 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_16 = BooleanField(validators=[validate_group])
    wvis_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_17 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_17 = BooleanField(validators=[validate_group])
    wvis_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_21 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_21 = BooleanField(validators=[validate_group])
    wvis_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_22 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_22 = BooleanField(validators=[validate_group])
    wvis_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_23 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_23 = BooleanField(validators=[validate_group])
    wvis_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_24 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_24 = BooleanField(validators=[validate_group])
    wvis_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_25 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_25 = BooleanField(validators=[validate_group])
    wvis_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_26 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_26 = BooleanField(validators=[validate_group])
    wvis_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_27 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_27 = BooleanField(validators=[validate_group])
    wvis_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_31 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_31 = BooleanField(validators=[validate_group])
    wvis_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_32 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_32 = BooleanField(validators=[validate_group])
    wvis_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_33 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_33 = BooleanField(validators=[validate_group])
    wvis_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_34 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_34 = BooleanField(validators=[validate_group])
    wvis_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_35 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_35 = BooleanField(validators=[validate_group])
    wvis_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_36 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_36 = BooleanField(validators=[validate_group])
    wvis_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_37 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_37 = BooleanField(validators=[validate_group])
    wvis_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_41 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_41 = BooleanField(validators=[validate_group])
    wvis_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_42 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_42 = BooleanField(validators=[validate_group])
    wvis_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_43 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_43 = BooleanField(validators=[validate_group])
    wvis_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_44 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_44 = BooleanField(validators=[validate_group])
    wvis_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_45 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_45 = BooleanField(validators=[validate_group])
    wvis_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_46 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_46 = BooleanField(validators=[validate_group])
    wvis_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvir_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvid_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvos_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvor_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    wvod_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsts_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstr_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fstd_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsds_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdr_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    fsdd_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtps_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpr_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    dtpd_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbts_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    rbtr_47 = IntegerField(validators=[NumberRange(min=0), Optional()])
    skip_47 = BooleanField(validators=[validate_group])
