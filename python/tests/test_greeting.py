"""验证安装后的公共接口，不依赖源码目录的导入路径。"""

import unittest

from emma_package_publish_lab import hello


class GreetingTest(unittest.TestCase):
    def test_default_name(self):
        self.assertEqual(hello(), "Hello, world!")

    def test_chinese_name(self):
        self.assertEqual(hello("小明"), "Hello, 小明!")

    def test_invalid_name(self):
        with self.assertRaises(TypeError):
            hello(123)


if __name__ == "__main__":
    unittest.main()
