"""用于验证安装和导入的最小功能。"""


def hello(name: str = "world") -> str:
    """生成问候语；输入类型错误时及时报错。"""
    if not isinstance(name, str):
        raise TypeError("name 必须是字符串")
    return f"Hello, {name}!"
