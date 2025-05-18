# alembic/env.py
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# 프로젝트 루트 경로를 Python 경로에 추가
# 이 부분은 사용자님의 프로젝트 구조에 맞게 조정될 수 있습니다.
# 현재 env.py 파일의 위치를 기준으로 프로젝트 루트를 추정합니다.
current_path = os.path.dirname(os.path.abspath(__file__))
# alembic 폴더 안에 env.py가 있으므로, 상위 폴더(프로젝트 루트)로 이동합니다.
project_root = os.path.abspath(os.path.join(current_path, ".."))
if project_root not in sys.path:
    sys.path.append(project_root)

# --- 아래부터 우리 프로젝트에 맞게 수정/추가된 내용 ---
from app.core.config import settings # 우리 프로젝트의 설정 파일 임포트
from app.domain.models.base import Base # 우리 프로젝트의 SQLAlchemy Base 모델 임포트

# 모든 모델들이 Base.metadata에 등록되도록 각 모델 파일을 임포트합니다.
# 이 부분이 누락되면 Alembic이 모델 변경 사항을 감지하지 못합니다.
print("Importing models for Alembic metadata...")
try:
    import app.domain.models.user # noqa
    import app.domain.models.story # noqa
    import app.domain.models.node # noqa
    import app.domain.models.stat # noqa
    import app.domain.models.prompt # noqa
    print("Models imported successfully.")
except ImportError as e:
    print(f"Error importing models: {e}")
    # 모델 임포트 실패 시, 경로 문제나 파일 누락일 수 있습니다.
    # sys.path를 다시 한번 확인하거나, 해당 파일들이 존재하는지 확인하세요.
    # 예: print(f"Current sys.path: {sys.path}")
    raise e

# --- 여기까지 수정/추가된 내용 ---


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# --- 이 부분을 우리 프로젝트에 맞게 수정 ---
print(f"Setting target_metadata to Base.metadata (ID: {id(Base.metadata)})")
target_metadata = Base.metadata # 우리 프로젝트의 모든 모델 메타데이터
# --- 여기까지 수정 ---

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.

# --- sqlalchemy.url 설정을 우리 프로젝트 설정에서 가져오도록 수정 ---
# alembic.ini의 sqlalchemy.url 대신 settings 객체에서 직접 가져와 설정합니다.
db_url = settings.SYNC_DATABASE_URL
if not db_url:
    # settings.DATABASE_URL을 직접 사용하도록 config.py를 수정했다면 아래와 같이 변경
    # db_url = settings.DATABASE_URL
    # if not db_url:
    raise ValueError("DATABASE_URL (or SYNC_DATABASE_URL) is not set in the app.core.config.settings.")

print(f"Using database URL for Alembic: {db_url}")
config.set_main_option("sqlalchemy.url", db_url)
# --- 여기까지 수정 ---


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # config.get_section(config.config_ini_section, {}) 대신
    # config.get_section(config.config_ini_section) 사용하거나,
    # 이미 URL이 config 객체에 설정되어 있으므로 직접 사용합니다.
    
    connectable_cfg = config.get_section(config.config_ini_section)
    if connectable_cfg is None:
        connectable_cfg = {}
    # 명시적으로 우리가 설정한 db_url을 사용하도록 합니다.
    connectable_cfg["sqlalchemy.url"] = db_url 

    connectable = engine_from_config(
        connectable_cfg, 
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    print("Running migrations in offline mode...")
    run_migrations_offline()
else:
    print("Running migrations in online mode...")
    run_migrations_online()

print("env.py execution finished.")
