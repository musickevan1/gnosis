from setuptools import setup, find_packages

setup(
    name="gnosis",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask>=2.3.3",
        "Flask-SQLAlchemy>=3.1.1",
        "Flask-Cors>=4.0.0",
        "python-jose>=3.3.0",
        "bcrypt>=4.0.1",
        "openai>=1.6.1",
        "python-dotenv>=1.0.0",
    ],
)
