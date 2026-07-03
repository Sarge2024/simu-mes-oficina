from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_auditlog_detalhamento'),
    ]

    operations = [
        migrations.AlterField(
            model_name='auditlog',
            name='acao',
            field=models.CharField(choices=[('Criado', 'Criado'), ('Editado', 'Editado'), ('Excluído', 'Excluído'), ('Rollback', 'Rollback')], max_length=50, verbose_name='Ação'),
        ),
        migrations.AlterField(
            model_name='auditlog',
            name='registro_id',
            field=models.CharField(db_index=True, max_length=255, verbose_name='ID do Registro'),
        ),
        migrations.AlterField(
            model_name='auditlog',
            name='tabela',
            field=models.CharField(db_index=True, max_length=100, verbose_name='Tabela'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['tabela', 'registro_id'], name='audit_log_tbl_idx'),
        ),
    ]
