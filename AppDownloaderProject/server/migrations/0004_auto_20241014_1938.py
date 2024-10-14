# Generated by Django 3.2.10 on 2024-10-14 14:08

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('server', '0003_category'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='androidapp',
            name='subCategory',
        ),
        migrations.AlterField(
            model_name='androidapp',
            name='category',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='server.category'),
        ),
        migrations.AlterField(
            model_name='category',
            name='name',
            field=models.CharField(max_length=100, unique=True),
        ),
        migrations.CreateModel(
            name='SubCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subcategories', to='server.category')),
            ],
            options={
                'unique_together': {('name', 'category')},
            },
        ),
        migrations.AddField(
            model_name='androidapp',
            name='subcategory',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='server.subcategory'),
        ),
    ]
